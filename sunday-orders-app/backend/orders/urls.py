from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CustomerViewSet, ProductViewSet, WeeklyOrderViewSet, DebtViewSet,
    DashboardViewSet, SalesEntryViewSet, GiveawayViewSet, ExpenseViewSet,
    CustomerOrderViewSet, login_view, logout_view, user_profile
)

router = DefaultRouter()
router.register(r'customers', CustomerViewSet)
router.register(r'products', ProductViewSet)
router.register(r'orders', WeeklyOrderViewSet)
router.register(r'customer-orders', CustomerOrderViewSet)
router.register(r'debts', DebtViewSet)
router.register(r'sales', SalesEntryViewSet)
router.register(r'giveaways', GiveawayViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'dashboard', DashboardViewSet, basename='dashboard')

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/auth/login/', login_view, name='login'),
    path('api/auth/logout/', logout_view, name='logout'),
    path('api/auth/profile/', user_profile, name='profile'),
]
