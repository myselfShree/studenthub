from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import List, Optional

from app.models.resource import Resource
from app.schemas.resource import ResourceCreate, ResourceUpdate

class ResourceService:
    @staticmethod
    def get_by_id(db: Session, resource_id: int, user_id: int) -> Optional[Resource]:
        """Fetch resource by ID for user."""
        return db.query(Resource).options(
            joinedload(Resource.subject)
        ).filter(
            Resource.id == resource_id,
            Resource.user_id == user_id
        ).first()

    @staticmethod
    def get_multi(
        db: Session,
        user_id: int,
        subject_id: Optional[int] = None,
        resource_type: Optional[str] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Resource]:
        """List user resources with optional subject, resource_type, and search filters."""
        query = db.query(Resource).options(
            joinedload(Resource.subject)
        ).filter(Resource.user_id == user_id)

        if subject_id is not None:
            query = query.filter(Resource.subject_id == subject_id)

        if resource_type:
            query = query.filter(Resource.resource_type == resource_type)

        if search:
            search_pattern = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Resource.title.ilike(search_pattern),
                    Resource.notes.ilike(search_pattern),
                    Resource.url.ilike(search_pattern)
                )
            )

        return query.order_by(Resource.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def create(db: Session, user_id: int, resource_in: ResourceCreate) -> Resource:
        """Create a new resource bookmark."""
        db_resource = Resource(
            user_id=user_id,
            subject_id=resource_in.subject_id,
            title=resource_in.title.strip(),
            url=resource_in.url.strip(),
            resource_type=resource_in.resource_type,
            notes=resource_in.notes
        )
        db.add(db_resource)
        db.commit()
        db.refresh(db_resource)
        return db_resource

    @staticmethod
    def update(db: Session, db_resource: Resource, resource_in: ResourceUpdate) -> Resource:
        """Update existing resource."""
        if resource_in.title is not None:
            db_resource.title = resource_in.title.strip()
        if resource_in.url is not None:
            db_resource.url = resource_in.url.strip()
        if resource_in.resource_type is not None:
            db_resource.resource_type = resource_in.resource_type
        if resource_in.notes is not None:
            db_resource.notes = resource_in.notes
        if resource_in.subject_id is not None:
            db_resource.subject_id = resource_in.subject_id if resource_in.subject_id != 0 else None

        db.commit()
        db.refresh(db_resource)
        return db_resource

    @staticmethod
    def delete(db: Session, db_resource: Resource) -> None:
        """Delete resource."""
        db.delete(db_resource)
        db.commit()

resource_service = ResourceService()
