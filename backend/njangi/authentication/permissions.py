from rest_framework import permissions

class IsOwner(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object to access/edit it.
    Assumes the model has a `user` field.
    """
    def has_object_permission(self, request, view, obj):
        # IDOR Protection: Strictly check ownership
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'wallet'):
            return obj.wallet.user == request.user
        return False

class IsGroupMember(permissions.BasePermission):
    """
    Object-level permission to allow access only to members of a group.
    """
    def has_object_permission(self, request, view, obj):
        # Handle cases where obj is NjangiGroup or Membership
        from groups.models import NjangiGroup, Membership
        
        if isinstance(obj, NjangiGroup):
            return obj.memberships.filter(user=request.user).exists()
        if isinstance(obj, Membership):
            return obj.group.memberships.filter(user=request.user).exists()
            
        return False
