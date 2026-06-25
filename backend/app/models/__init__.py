"""Export models để Alembic autogenerate nhận diện."""
from app.models.blog import (  # noqa: F401
    BlogCategory,
    BlogPost,
    Tag,
    post_tags,
)
from app.models.product import (  # noqa: F401
    Product,
    ProductCategory,
    ProductImage,
    ProductPrice,
    ProductInventory,
)
from app.models.user import (  # noqa: F401
    Permission,
    Role,
    User,
    role_permissions,
    user_roles,
)
from app.models.contact import ContactSubmission  # noqa: F401
from app.models.customer import Customer  # noqa: F401
from app.models.lead import Lead  # noqa: F401
from app.models.opportunity import Opportunity  # noqa: F401
from app.models.interaction import Interaction  # noqa: F401
from app.models.dealer import Dealer  # noqa: F401
from app.models.dealer_discount import DealerDiscount  # noqa: F401
from app.models.dealer_ledger import DealerLedger  # noqa: F401
from app.models.order import Order, OrderItem, OrderStatusLog  # noqa: F401
from app.models.qrcode import ProductBatch, QRCode, QRScanLog  # noqa: F401
from app.models.payment import PaymentTransaction  # noqa: F401



__all__ = [
    "PaymentTransaction",
    "User",
    "Role",
    "Permission",
    "user_roles",
    "role_permissions",
    "BlogCategory",
    "BlogPost",
    "Tag",
    "post_tags",
    "ProductCategory",
    "Product",
    "ProductImage",
    "ProductPrice",
    "ProductInventory",
    "ContactSubmission",
    "Customer",
    "Lead",
    "Opportunity",
    "Interaction",
    "Dealer",
    "DealerDiscount",
    "DealerLedger",
    "Order",
    "OrderItem",
    "OrderStatusLog",
]

