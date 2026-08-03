from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum
from typing import Any, Generator, Optional

from sqlalchemy import asc, desc, func, or_
from sqlalchemy.orm import Session


class AggFunc(Enum):
    """Framework-agnostic aggregate function identifiers."""

    SUM = "sum"
    AVG = "avg"
    MIN = "min"
    MAX = "max"
    COUNT = "count"


@dataclass
class AggSpec:
    """Pairs an aggregate operation with the target field name.

    Example::

        AggSpec(AggFunc.SUM, "usd_salary")   # → func.sum(Model.usd_salary)
    """

    op: AggFunc
    field: str


class IDatabaseAdapter(ABC):
    """Abstract Database Adapter Interface decoupling repositories from any ORM."""

    @abstractmethod
    def find_one(self, model: Any, filters: Optional[list] = None) -> Optional[Any]:
        """Fetch single entity matching filters."""

    @abstractmethod
    def find_all(
        self,
        model: Any,
        filters: Optional[list] = None,
        sort_col: Optional[str] = None,
        sort_order: str = "asc",
        offset: Optional[int] = None,
        limit: Optional[int] = None,
    ) -> list[Any]:
        """Fetch all entities matching filters with optional sort, offset, and limit.

        Args:
            sort_col: Model field name string (e.g. ``"last_name"``).
        """

    @abstractmethod
    def count(self, model: Any, filters: Optional[list] = None) -> int:
        """Count total entities matching filters."""

    @abstractmethod
    def aggregate(
        self,
        model: Any,
        aggs: list[Any],
        group_by: Optional[list[str]] = None,
        filters: Optional[list] = None,
        order_by: Optional[list[Any]] = None,
        order_desc: bool = False,
    ) -> list[tuple]:
        """Execute aggregate queries.

        Args:
            aggs: Mix of :class:`AggSpec` (compute a function) and plain ``str``
                  field names (project the column).
            group_by: Field name strings to GROUP BY.
            order_by: Mix of :class:`AggSpec` and plain ``str`` field names to ORDER BY.
            order_desc: Apply DESC to all ``order_by`` expressions when ``True``.
        """

    @abstractmethod
    def ilike_search(self, model: Any, fields: list[str], pattern: str) -> Any:
        """Return an opaque filter for OR-joined case-insensitive LIKE across fields.

        The returned value can be appended directly to a ``filters`` list.
        """

    @abstractmethod
    def save(self, model: Any, data_dict: dict) -> Any:
        """Create and persist a new entity record."""

    @abstractmethod
    def update(self, model: Any, filters: list, data_dict: dict) -> Any:
        """Update fields on entity matching filters."""

    @abstractmethod
    def delete(self, model: Any, filters: list) -> None:
        """Delete entity matching filters."""

    @abstractmethod
    def stream_batches(
        self,
        model: Any,
        filters: Optional[list] = None,
        sort_col: Optional[str] = None,
        batch_size: int = 1000,
    ) -> Generator[list[Any], None, None]:
        """Stream entities matching filters in fixed-size batches.

        Args:
            sort_col: Model field name string (e.g. ``"id"``).
        """


# ---------------------------------------------------------------------------
# SQLAlchemy concrete implementation
# ---------------------------------------------------------------------------

_AGG_FUNC_MAP = {
    AggFunc.SUM: func.sum,
    AggFunc.AVG: func.avg,
    AggFunc.MIN: func.min,
    AggFunc.MAX: func.max,
    AggFunc.COUNT: func.count,
}


class SQLAlchemyDatabaseAdapter(IDatabaseAdapter):
    """Concrete Database Adapter implementing IDatabaseAdapter via SQLAlchemy 2.0.

    All SQLAlchemy expression objects are built exclusively inside this class.
    Repositories remain ORM-agnostic.
    """

    def __init__(self, session: Session):
        self.session = session

    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------

    def _apply_filters(self, query: Any, filters: Optional[list]) -> Any:
        if filters:
            for f in filters:
                query = query.filter(f)
        return query

    def _resolve_agg_expr(self, model: Any, spec: Any) -> Any:
        """Translate an AggSpec or field-name string to a SQLAlchemy expression."""
        if isinstance(spec, AggSpec):
            col = getattr(model, spec.field)
            return _AGG_FUNC_MAP[spec.op](col)
        # plain str → project the column directly
        return getattr(model, spec)

    def _resolve_order_expr(self, model: Any, spec: Any, order_desc_flag: bool) -> Any:
        """Translate an AggSpec or field-name string to an ORDER BY expression."""
        expr = self._resolve_agg_expr(model, spec)
        return desc(expr) if order_desc_flag else asc(expr)

    # ------------------------------------------------------------------
    # IDatabaseAdapter implementation
    # ------------------------------------------------------------------

    def find_one(self, model: Any, filters: Optional[list] = None) -> Optional[Any]:
        query = self.session.query(model)
        query = self._apply_filters(query, filters)
        return query.first()

    def find_all(
        self,
        model: Any,
        filters: Optional[list] = None,
        sort_col: Optional[str] = None,
        sort_order: str = "asc",
        offset: Optional[int] = None,
        limit: Optional[int] = None,
    ) -> list[Any]:
        query = self.session.query(model)
        query = self._apply_filters(query, filters)

        if sort_col is not None:
            col = getattr(model, sort_col)
            direction = desc(col) if sort_order.lower() == "desc" else asc(col)
            query = query.order_by(direction)

        if offset is not None:
            query = query.offset(offset)
        if limit is not None:
            query = query.limit(limit)

        return query.all()

    def count(self, model: Any, filters: Optional[list] = None) -> int:
        pk_col = (
            model.id
            if hasattr(model, "id")
            else getattr(model, list(model.__table__.columns.keys())[0])
        )
        query = self.session.query(func.count(pk_col))
        query = self._apply_filters(query, filters)
        return query.scalar() or 0

    def aggregate(
        self,
        model: Any,
        aggs: list[Any],
        group_by: Optional[list[str]] = None,
        filters: Optional[list] = None,
        order_by: Optional[list[Any]] = None,
        order_desc: bool = False,
    ) -> list[tuple]:
        agg_exprs = [self._resolve_agg_expr(model, spec) for spec in aggs]
        query = self.session.query(*agg_exprs)
        query = self._apply_filters(query, filters)

        if group_by:
            query = query.group_by(*[getattr(model, f) for f in group_by])
        if order_by:
            order_exprs = [
                self._resolve_order_expr(model, spec, order_desc) for spec in order_by
            ]
            query = query.order_by(*order_exprs)

        return query.all()

    def ilike_search(self, model: Any, fields: list[str], pattern: str) -> Any:
        return or_(*[getattr(model, f).ilike(pattern) for f in fields])

    def save(self, model: Any, data_dict: dict) -> Any:
        instance = model(**data_dict)
        self.session.add(instance)
        self.session.commit()
        self.session.refresh(instance)
        return instance

    def update(self, model: Any, filters: list, data_dict: dict) -> Any:
        query = self.session.query(model)
        query = self._apply_filters(query, filters)
        instance = query.first()
        if instance:
            for k, v in data_dict.items():
                setattr(instance, k, v)
            self.session.commit()
            self.session.refresh(instance)
        return instance

    def delete(self, model: Any, filters: list) -> None:
        query = self.session.query(model)
        query = self._apply_filters(query, filters)
        instance = query.first()
        if instance:
            self.session.delete(instance)
            self.session.commit()

    def stream_batches(
        self,
        model: Any,
        filters: Optional[list] = None,
        sort_col: Optional[str] = None,
        batch_size: int = 1000,
    ) -> Generator[list[Any], None, None]:
        offset = 0
        while True:
            batch = self.find_all(
                model=model,
                filters=filters,
                sort_col=sort_col,
                sort_order="asc",
                offset=offset,
                limit=batch_size,
            )
            if not batch:
                break
            yield batch
            offset += batch_size
