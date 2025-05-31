from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.auth import (
    create_access_token,
    verify_password,
    get_current_user
)
from app.core.config import settings
from app.db.deps import get_database
from app.models.user import User
from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    id: int
    username: str
    is_active: bool
    is_superuser: bool

    class Config:
        from_attributes = True


router = APIRouter(
    prefix='/auth',
    tags=['Authentication'],
)


@router.post('/register')
def register(
    db: Session = Depends(get_database),
) -> Any:
    """
    Register a new user.
    """

    from app.core.auth import get_password_hash

    # Check if the user already exists
    if not db.query(User).first():
        user = User(
            username=settings.DEFAULT_USER_USERNAME,
            hashed_password=get_password_hash(settings.DEFAULT_USER_PASSWORD),
            is_active=True,
            is_superuser=True
        )
        db.add(user)
        db.commit()


@router.post('/token', response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_database)
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """

    # Get the default user
    user = db.query(User).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Default user not found. Please run database migrations.',
        )
    
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Incorrect password',
            headers={'WWW-Authenticate': 'Bearer'},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={'sub': str(user.id)},
        expires_delta=access_token_expires
    )
    
    return {
        'access_token': access_token,
        'token_type': 'bearer',
    }


@router.get('/me', response_model=UserResponse)
def get_current_user_info(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get current user information.
    """

    return current_user 