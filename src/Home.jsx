import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import AIAssistant from "./components/AIAssistant";
import FAQ from "./components/FAQ";
import { auth } from "./firebase";

import {
  Sprout,
  Search,
  ShoppingCart,
  Menu,
  X,
  ArrowRight,
  Leaf,
  Truck,
  ShieldCheck,
  Plus,
  Minus,
  MapPin,
  Heart,
  Trash2,
  ShoppingBag,
  RefreshCw,
} from "lucide-react";

import "./index.css";

const API_URL = "/api";

const categories = [
  { name: "Vegetables", emoji: "🥦" },
  { name: "Fruits", emoji: "🍎" },
  { name: "Grains", emoji: "🌾" },
  { name: "Dairy", emoji: "🥛" },
];

function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [checkoutItems, setCheckoutItems] = useState(null);

  const [mobileMenu, setMobileMenu] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");

  const [message, setMessage] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);

  // Authentication states
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [profileName, setProfileName] = useState("");
  const [authLoading, setAuthLoading] = useState(true);

  const [deliveryDetails, setDeliveryDetails] = useState({
    customerName: "",
    phone: "",
    address: "",
  });

  // Notification
  function showMessage(text) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 3000);
  }

  // Firebase authentication and user profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setUserRole(null);
      setProfileName("");

      if (!user) {
        setAuthLoading(false);
        return;
      }

      setAuthLoading(true);

      try {
        const token = await user.getIdToken();

        const response = await fetch(`https://graminconnect-new.onrender.com/api/users/profile`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Unable to load user profile.");
        }

        const data = await response.json();

        setUserRole(data.user?.role || null);

        setProfileName(
          data.user?.name ||
            user.displayName ||
            user.email?.split("@")[0] ||
            "User"
        );
      } catch (err) {
        console.error("Profile loading error:", err);

        setUserRole(null);

        setProfileName(
          user.displayName ||
            user.email?.split("@")[0] ||
            "User"
        );
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch products from MongoDB
  async function fetchProducts() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("https://graminconnect-new.onrender.com/api/crops");

      if (!response.ok) {
        throw new Error("Unable to load products.");
      }

      const data = await response.json();

      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Product loading error:", err);

      setError(
        "Unable to load products. Please check your backend."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  // Logout
  async function handleLogout() {
    try {
      await signOut(auth);

      setCurrentUser(null);
      setUserRole(null);
      setProfileName("");

      setCart([]);
      setCheckoutItems(null);

      setCartOpen(false);
      setCheckoutOpen(false);

      showMessage("You have been logged out.");
    } catch (err) {
      console.error("Logout error:", err);
      showMessage("Unable to logout. Please try again.");
    }
  }

  // Customer-only access check
  function requireCustomerLogin() {
    if (authLoading) {
      showMessage("Please wait, checking your account...");
      return false;
    }

    if (!currentUser) {
      showMessage("Please login or register to buy products.");

      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);

      return false;
    }

    if (userRole !== "customer") {
      showMessage(
        userRole === "farmer"
          ? "Farmers cannot purchase products using a farmer account."
          : "Your customer profile could not be loaded. Please login again."
      );

      return false;
    }

    return true;
  }

  // Cart calculations
  const cartCount = cart.reduce(
    (total, item) => total + item.cartQuantity,
    0
  );

  const cartTotal = cart.reduce(
    (total, item) =>
      total + Number(item.price) * item.cartQuantity,
    0
  );

  // Checkout items: either Buy Now item or normal cart
  const orderItems = checkoutItems ?? cart;

  const orderItemCount = orderItems.reduce(
    (total, item) => total + item.cartQuantity,
    0
  );

  const orderTotal = orderItems.reduce(
    (total, item) =>
      total + Number(item.price) * item.cartQuantity,
    0
  );

  // Search and category filtering
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name?.toLowerCase().includes(search.toLowerCase()) ||
      product.category?.toLowerCase().includes(search.toLowerCase()) ||
      product.location?.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      activeCategory === "All" ||
      product.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  // Add product to cart
  function addToCart(product) {
    if (!requireCustomerLogin()) return;

    const stock = Number(product.quantity);

    if (stock <= 0) {
      showMessage("This product is out of stock.");
      return;
    }

    const existingItem = cart.find(
      (item) => item._id === product._id
    );

    if (existingItem && existingItem.cartQuantity >= stock) {
      showMessage("Available stock limit reached.");
      return;
    }

    setCart((previousCart) => {
      const existing = previousCart.find(
        (item) => item._id === product._id
      );

      if (existing) {
        return previousCart.map((item) =>
          item._id === product._id
            ? {
                ...item,
                cartQuantity: item.cartQuantity + 1,
              }
            : item
        );
      }

      return [
        ...previousCart,
        {
          ...product,
          availableStock: stock,
          cartQuantity: 1,
        },
      ];
    });

    showMessage(`${product.name} added to cart!`);
  }

  // Buy Now - checkout selected product only
  function buyNow(product) {
    if (!requireCustomerLogin()) return;

    const stock = Number(product.quantity);

    if (stock <= 0) {
      showMessage("This product is out of stock.");
      return;
    }

    setCheckoutItems([
      {
        ...product,
        availableStock: stock,
        cartQuantity: 1,
      },
    ]);

    setCartOpen(false);
    setCheckoutOpen(true);
  }

  // Increase cart quantity
  function increaseQuantity(productId) {
    if (!requireCustomerLogin()) return;

    setCart((previousCart) =>
      previousCart.map((item) => {
        if (item._id === productId) {
          if (item.cartQuantity >= item.availableStock) {
            showMessage("Available stock limit reached.");
            return item;
          }

          return {
            ...item,
            cartQuantity: item.cartQuantity + 1,
          };
        }

        return item;
      })
    );
  }

  // Decrease cart quantity
  function decreaseQuantity(productId) {
    if (!requireCustomerLogin()) return;

    setCart((previousCart) =>
      previousCart
        .map((item) =>
          item._id === productId
            ? {
                ...item,
                cartQuantity: item.cartQuantity - 1,
              }
            : item
        )
        .filter((item) => item.cartQuantity > 0)
    );
  }

  // Remove product from cart
  function removeFromCart(productId) {
    if (!requireCustomerLogin()) return;

    setCart((previousCart) =>
      previousCart.filter(
        (item) => item._id !== productId
      )
    );

    showMessage("Product removed from cart.");
  }

  // Scroll to products
  function scrollToProducts() {
    document.getElementById("products")?.scrollIntoView({
      behavior: "smooth",
    });

    setMobileMenu(false);
  }

  function chooseCategory(category) {
    setActiveCategory(category);
    setMobileMenu(false);

    document.getElementById("products")?.scrollIntoView({
      behavior: "smooth",
    });
  }

  // Open cart
  function openCart() {
    if (!requireCustomerLogin()) return;

    setCartOpen(true);
    setMobileMenu(false);
  }

  // Open checkout from cart
  function handleCheckout() {
    if (!requireCustomerLogin()) return;

    if (cart.length === 0) {
      showMessage("Your cart is empty.");
      return;
    }

    setCheckoutItems(null);
    setCartOpen(false);
    setCheckoutOpen(true);
  }

  // Place order through backend API
  async function handlePlaceOrder(event) {
    event.preventDefault();

    if (!requireCustomerLogin()) return;
    if (placingOrder) return;

    if (orderItems.length === 0) {
      showMessage("Your cart is empty.");
      return;
    }

    if (!/^[0-9]{10}$/.test(deliveryDetails.phone)) {
      showMessage("Enter a valid 10-digit phone number.");
      return;
    }

    if (!deliveryDetails.address.trim()) {
      showMessage("Please enter your delivery address.");
      return;
    }

    try {
      setPlacingOrder(true);

      const user = auth.currentUser;

      if (!user) {
        throw new Error(
          "Please login again before placing your order."
        );
      }

      const token = await user.getIdToken();

      const response = await fetch(`https://graminconnect-new.onrender.com/api/orders/place`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone: deliveryDetails.phone,
          address: deliveryDetails.address.trim(),
          items: orderItems.map((item) => ({
            cropId: item._id,
            quantity: item.cartQuantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to place your order."
        );
      }

      // Preserve normal cart when using Buy Now
      setCheckoutOpen(false);

      if (checkoutItems === null) {
        setCart([]);
      }

      setCheckoutItems(null);

      setDeliveryDetails({
        customerName: "",
        phone: "",
        address: "",
      });

      await fetchProducts();

      showMessage("Order placed successfully!");

      console.log("Order details:", data.order);
    } catch (err) {
      console.error("Order placement error:", err);
      showMessage(err.message || "Something went wrong.");
    } finally {
      setPlacingOrder(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F4FAF1] text-[#1B2E1B]">
          {/* NAVBAR */}
      <header className="sticky top-0 z-40 border-b border-green-100 bg-white/95 backdrop-blur-md">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">

          <a href="#home" className="flex items-center gap-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-600 text-white">
              <Sprout size={27} />
            </div>

            <div>
              <h1 className="text-xl font-extrabold">
                Gramin<span className="text-green-600">Connect</span>
              </h1>

              <p className="text-xs text-gray-500">
                Farm fresh. Fair prices.
              </p>
            </div>
          </a>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#home">Home</a>
            <a href="#categories">Categories</a>
            <a href="#products">Products</a>
            <a href="#about">About Us</a>
          </div>

          {/* DESKTOP AUTH NAVBAR */}
          <div className="hidden items-center gap-3 md:flex">
            {authLoading ? (
              <span className="text-sm text-gray-500">
                Checking account...
              </span>
            ) : currentUser ? (
              <>
                <span className="max-w-40 truncate text-sm font-semibold text-green-800">
                  Hi, {profileName || "User"}
                </span>

                {/* CUSTOMER CART */}
                {userRole === "customer" && (
                  <button
                    onClick={openCart}
                    className="relative rounded-xl border border-green-100 p-3 hover:bg-green-50"
                    aria-label="Open shopping cart"
                  >
                    <ShoppingCart size={21} />

                    {cartCount > 0 && (
                      <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-green-600 px-1 text-xs text-white">
                        {cartCount}
                      </span>
                    )}
                  </button>
                )}

                {/* FARMER ORDERS */}
                {userRole === "farmer" && (
                  <Link
                    to="/farmer-dashboard"
                    className="rounded-xl border border-green-200 px-4 py-3 font-semibold text-green-700 hover:bg-green-50"
                  >
                    Orders
                  </Link>
                )}

                {/* CUSTOMER DASHBOARD */}
                {userRole === "customer" && (
                  <Link
                    to="/customer-dashboard"
                    className="rounded-xl border border-green-200 px-4 py-3 font-semibold text-green-700 hover:bg-green-50"
                  >
                    My Dashboard
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="rounded-xl bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-xl border border-green-200 px-5 py-3 font-semibold text-green-700 hover:bg-green-50"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  className="rounded-xl bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* MOBILE MENU BUTTON */}
          <button
            className="rounded-lg p-2 md:hidden"
            onClick={() => setMobileMenu(!mobileMenu)}
            aria-label="Toggle menu"
          >
            {mobileMenu ? <X /> : <Menu />}
          </button>
        </nav>

        {/* MOBILE NAVBAR */}
        {mobileMenu && (
          <div className="border-t border-green-100 bg-white px-5 py-4 md:hidden">
            <div className="flex flex-col gap-4">
              <a
                href="#home"
                onClick={() => setMobileMenu(false)}
              >
                Home
              </a>

              <a
                href="#categories"
                onClick={() => setMobileMenu(false)}
              >
                Categories
              </a>

              <a
                href="#products"
                onClick={() => setMobileMenu(false)}
              >
                Products
              </a>

              <a
                href="#about"
                onClick={() => setMobileMenu(false)}
              >
                About Us
              </a>

              {!authLoading && currentUser && (
                <>
                  <p className="font-semibold text-green-800">
                    Hi, {profileName || "User"}
                  </p>

                  {userRole === "customer" && (
                    <button
                      onClick={openCart}
                      className="flex items-center justify-center gap-2 rounded-xl border border-green-200 p-3 text-green-700"
                    >
                      <ShoppingCart size={19} />
                      Cart ({cartCount})
                    </button>
                  )}

                  {userRole === "farmer" && (
                    <Link
                      to="/farmer-dashboard"
                      onClick={() => setMobileMenu(false)}
                      className="rounded-xl border border-green-200 p-3 text-center text-green-700"
                    >
                      Orders
                    </Link>
                  )}

                  {userRole === "customer" && (
                    <Link
                      to="/customer-dashboard"
                      onClick={() => setMobileMenu(false)}
                      className="rounded-xl border border-green-200 p-3 text-center text-green-700"
                    >
                      My Dashboard
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setMobileMenu(false);
                      handleLogout();
                    }}
                    className="rounded-xl bg-green-600 p-3 text-center font-semibold text-white"
                  >
                    Logout
                  </button>
                </>
              )}

              {!authLoading && !currentUser && (
                <div className="flex gap-3">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenu(false)}
                    className="flex-1 rounded-xl border border-green-200 p-3 text-center text-green-700"
                  >
                    Login
                  </Link>

                  <Link
                    to="/register"
                    onClick={() => setMobileMenu(false)}
                    className="flex-1 rounded-xl bg-green-600 p-3 text-center text-white"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* NOTIFICATION */}
      {message && (
        <div
          role="status"
          className="fixed right-4 top-24 z-[110] rounded-xl bg-green-700 px-5 py-3 text-white shadow-xl"
        >
          {message}
        </div>
      )}

      {/* HERO */}
      <section id="home" className="overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 md:py-24 lg:grid-cols-2 lg:px-8">

          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-200 bg-white px-4 py-2 text-sm font-semibold text-green-700">
              <Leaf size={17} />
              Supporting Indian Farmers
            </div>

            <h2 className="text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              Fresh From
              <span className="block text-green-600">
                Farmers,
              </span>
              Direct To You.
            </h2>

            <p className="mt-6 max-w-xl text-lg leading-8 text-gray-600">
              Discover fresh farm produce, connect directly with farmers,
              and enjoy quality products at fair prices.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                onClick={scrollToProducts}
                className="flex items-center gap-2 rounded-xl bg-green-600 px-6 py-4 font-bold text-white hover:bg-green-700"
              >
                Explore Products
                <ArrowRight size={19} />
              </button>

              <Link
                to="/register"
                className="rounded-xl border border-green-200 bg-white px-6 py-4 font-bold text-green-700 hover:bg-green-50"
              >
                I'm a Farmer
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-8">
              <div>
                <h3 className="text-2xl font-extrabold">
                  Farm Fresh
                </h3>
                <p className="text-sm text-gray-500">
                  Quality produce
                </p>
              </div>

              <div>
                <h3 className="text-2xl font-extrabold">
                  Fair
                </h3>
                <p className="text-sm text-gray-500">
                  Listed prices
                </p>
              </div>

              <div>
                <h3 className="text-2xl font-extrabold">
                  Direct
                </h3>
                <p className="text-sm text-gray-500">
                  Farm to customer
                </p>
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div className="rounded-[2rem] border border-green-100 bg-white p-8 shadow-2xl">

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    Straight from the farm
                  </p>

                  <h3 className="mt-1 text-xl font-bold">
                    Nature's Best 🌿
                  </h3>
                </div>

                <Sprout
                  size={30}
                  className="text-green-600"
                />
              </div>

              <div className="my-7 grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-green-50 p-6 text-center">
                  <span className="text-6xl">🥦</span>
                  <p className="mt-3 font-bold">Fresh Greens</p>
                </div>

                <div className="rounded-2xl bg-orange-50 p-6 text-center">
                  <span className="text-6xl">🥕</span>
                  <p className="mt-3 font-bold">Organic Carrots</p>
                </div>

                <div className="rounded-2xl bg-yellow-50 p-5 text-center">
                  <span className="text-5xl">🌾</span>
                  <p className="mt-2 font-bold">Natural Grains</p>
                </div>

                <div className="rounded-2xl bg-rose-50 p-5 text-center">
                  <span className="text-5xl">🍎</span>
                  <p className="mt-2 font-bold">Fresh Fruits</p>
                </div>
              </div>

              <div className="rounded-2xl bg-green-50 p-4">
                <p className="font-bold">
                  Support Local Farmers ❤️
                </p>

                <p className="text-sm text-gray-600">
                  Every purchase makes a difference.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="border-y border-green-100 bg-white py-8">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 sm:grid-cols-3 lg:px-8">

          <div className="flex items-center gap-4">
            <Sprout size={30} className="text-green-600" />

            <div>
              <h3 className="font-bold">
                Fresh From Farms
              </h3>
              <p className="text-sm text-gray-500">
                Products from farmers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ShieldCheck size={30} className="text-green-600" />

            <div>
              <h3 className="font-bold">
                Transparent Pricing
              </h3>
              <p className="text-sm text-gray-500">
                Clear listed prices
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Truck size={30} className="text-green-600" />

            <div>
              <h3 className="font-bold">
                Convenient Shopping
              </h3>
              <p className="text-sm text-gray-500">
                Explore produce in one place
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* CATEGORIES */}
      <section id="categories" className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">

          <div className="text-center">
            <p className="font-bold uppercase tracking-widest text-green-600">
              <h2>Shop by Category</h2>
            </p>

            

            <p className="mt-4 text-gray-600">
              Find fresh, quality produce for your everyday needs.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {categories.map((category) => (
              <button
                key={category.name}
                onClick={() => chooseCategory(category.name)}
                className="rounded-2xl border border-green-100 bg-white p-6 text-center hover:shadow-lg"
              >
                <span className="text-5xl">
                  {category.emoji}
                </span>

                <h3 className="mt-4 font-bold">
                  {category.name}
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Explore products
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section id="products" className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">

          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="font-bold uppercase tracking-widest text-green-600">
                Freshly Picked
              </p>

              <h2 className="mt-3 text-3xl font-extrabold">
                Products From Our Farmers
              </h2>

              <p className="mt-3 text-gray-600">
                Real products uploaded by GraminConnect farmers.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-green-100 bg-[#F4FAF1] px-4 py-3 md:max-w-sm">
              <Search
                className="text-green-700"
                size={21}
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products or locations..."
                className="w-full bg-transparent outline-none"
              />
            </div>
          </div>

          {/* CATEGORY FILTERS */}
          <div className="mt-7 flex flex-wrap gap-3">
            {["All", ...new Set(products.map((p) => p.category))].map(
              (category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`rounded-full px-5 py-2.5 font-semibold ${
                    activeCategory === category
                      ? "bg-green-600 text-white"
                      : "border border-green-100 text-gray-600 hover:bg-green-50"
                  }`}
                >
                  {category}
                </button>
              )
            )}
          </div>

          {/* PRODUCT LIST */}
          <div className="mt-8">
            {loading ? (
              <div className="py-16 text-center text-green-700">
                <RefreshCw
                  className="mx-auto mb-3 animate-spin"
                  size={30}
                />
                Loading fresh products...
              </div>
            ) : error ? (
              <div className="py-16 text-center">
                <p className="text-red-600">{error}</p>

                <button
                  onClick={fetchProducts}
                  className="mt-4 rounded-xl bg-green-600 px-5 py-3 text-white"
                >
                  Try Again
                </button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-5xl">🌱</p>

                <h3 className="mt-4 text-xl font-bold">
                  No products found
                </h3>

                <p className="mt-2 text-gray-500">
                  Products uploaded by farmers will appear here.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {filteredProducts.map((product) => (
                  <article
                    key={product._id}
                    className="overflow-hidden rounded-2xl border border-green-100 bg-white transition hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="relative flex h-52 items-center justify-center bg-green-50">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-7xl">🌱</span>
                      )}

                      <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-bold text-green-700">
                        Fresh
                      </span>

                      <button
                        onClick={() =>
                          showMessage("Favourites coming soon!")
                        }
                        className="absolute right-3 top-3 rounded-full bg-white p-2 text-gray-500 hover:text-red-500"
                        aria-label="Add to favourites"
                      >
                        <Heart size={18} />
                      </button>
                    </div>

                    <div className="p-5">
                      <p className="text-sm font-medium text-green-700">
                        {product.category}
                      </p>

                      <h3 className="mt-1 text-lg font-bold capitalize">
                        {product.name}
                      </h3>

                      <div className="mt-2 flex items-center gap-1 text-sm text-gray-500">
                        <MapPin size={15} />
                        {product.location}
                      </div>

                      <p className="mt-3 text-sm text-gray-500">
                        Available Quantity: {product.quantity}
                      </p>

                      <p className="mt-3 text-sm text-gray-600">
                        {product.description}
                      </p>

                      <div className="mt-5 flex items-center justify-between gap-3 border-t border-green-50 pt-4">
                        <div>
                          <span className="text-xl font-extrabold text-green-700">
                            ₹{product.price}
                          </span>

                          <span className="text-sm text-gray-500">
                            / unit
                          </span>
                        </div>

                        {/* CUSTOMER PURCHASE OPTIONS */}
                        {authLoading ? (
                          <button
                            disabled
                            className="rounded-xl bg-gray-400 px-4 py-3 text-sm font-semibold text-white"
                          >
                            Please wait
                          </button>
                        ) : userRole === "customer" && currentUser ? (
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => addToCart(product)}
                              disabled={Number(product.quantity) <= 0}
                              className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                            >
                              <Plus size={17} />
                              Add to Cart
                            </button>

                            <button
                              onClick={() => buyNow(product)}
                              disabled={Number(product.quantity) <= 0}
                              className="rounded-xl border border-green-600 px-4 py-3 font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Buy Now
                            </button>
                          </div>
                        ) : userRole === "farmer" && currentUser ? (
                          <span className="rounded-xl bg-green-50 px-3 py-3 text-xs font-semibold text-green-700">
                            Farmer Account
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              showMessage(
                                "Login or register as a customer to buy."
                              );

                              setTimeout(() => {
                                window.location.href = "/login";
                              }, 1000);
                            }}
                            disabled={Number(product.quantity) <= 0}
                            className="rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                          >
                            Login to Buy
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
            {/* ABOUT */}
      <section id="about" className="py-16 md:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 md:grid-cols-2 lg:px-8">

          <div className="rounded-3xl bg-green-100 p-8 sm:p-12">
            <div className="text-7xl">🧑‍🌾</div>

            <h2 className="mt-6 text-3xl font-extrabold">
              Empowering Farmers,
              <span className="block text-green-700">
                One Connection at a Time.
              </span>
            </h2>

            <p className="mt-4 leading-7 text-gray-600">
              We want to make it easier for farmers to reach customers
              and for customers to discover fresh farm produce.
            </p>
          </div>

          <div>
            <p className="font-bold uppercase tracking-widest text-green-600">
              Why GraminConnect?
            </p>

            <h2 className="mt-3 text-3xl font-extrabold">
              A Better Way to Connect Farm and Home
            </h2>

            <p className="mt-5 leading-8 text-gray-600">
              GraminConnect brings farmers and customers closer through
              a simple digital marketplace.
            </p>

            <button
              onClick={scrollToProducts}
              className="mt-8 flex items-center gap-2 rounded-xl bg-green-600 px-6 py-4 font-bold text-white hover:bg-green-700"
            >
              Discover Products
              <ArrowRight size={19} />
            </button>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#183D25] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">

          <div>
            <div className="flex items-center gap-2">
              <Sprout size={28} />

              <span className="text-xl font-extrabold">
                GraminConnect
              </span>
            </div>

            <p className="mt-4 text-sm leading-7 text-green-100/80">
              Connecting Indian farmers and customers for a fresher,
              fairer food marketplace.
            </p>
          </div>

          <div>
            <h3 className="font-bold">Quick Links</h3>

            <div className="mt-4 flex flex-col gap-3 text-sm text-green-100/80">
              <a href="#home">Home</a>
              <a href="#categories">Categories</a>
              <a href="#products">Products</a>
              <a href="#about">About Us</a>
            </div>
          </div>

          <div>
            <h3 className="font-bold">For Farmers</h3>

            <div className="mt-4 flex flex-col gap-3 text-sm text-green-100/80">
              <Link to="/register">
                Join GraminConnect
              </Link>

              <Link to="/farmer-dashboard">
                Farmer Dashboard
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-bold">Our Mission</h3>

            <p className="mt-4 text-sm leading-7 text-green-100/80">
              Supporting local agriculture through digital connections
              and a farmer-friendly marketplace.
            </p>
          </div>

        </div>

        <div className="border-t border-white/10 px-5 py-5 text-center text-sm text-green-100/70">
          © {new Date().getFullYear()} GraminConnect. All rights reserved.
        </div>
      </footer>

      {/* CART DRAWER - CUSTOMER ONLY */}
      {cartOpen && currentUser && userRole === "customer" && (
        <div className="fixed inset-0 z-[80]">

          <button
            aria-label="Close cart"
            className="absolute inset-0 h-full w-full bg-black/40"
            onClick={() => setCartOpen(false)}
          />

          <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b px-5 py-5">
              <div>
                <h2 className="text-xl font-extrabold">
                  Your Shopping Cart
                </h2>

                <p className="text-sm text-gray-500">
                  {cartCount} item(s)
                </p>
              </div>

              <button
                onClick={() => setCartOpen(false)}
                aria-label="Close cart"
              >
                <X size={23} />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center">
                <ShoppingBag
                  size={45}
                  className="text-green-600"
                />

                <h3 className="mt-5 text-xl font-bold">
                  Your cart is empty
                </h3>

                <button
                  onClick={() => {
                    setCartOpen(false);
                    scrollToProducts();
                  }}
                  className="mt-6 rounded-xl bg-green-600 px-6 py-3 text-white"
                >
                  Explore Products
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-4 overflow-y-auto p-5">
                  {cart.map((item) => (
                    <div
                      key={item._id}
                      className="flex gap-4 rounded-2xl border p-4"
                    >
                      <img
                        src={
                          item.imageUrl ||
                          "https://placehold.co/100x100?text=Crop"
                        }
                        alt={item.name}
                        className="h-20 w-20 rounded-xl object-cover"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between gap-2">
                          <h3 className="font-bold capitalize">
                            {item.name}
                          </h3>

                          <button
                            onClick={() => removeFromCart(item._id)}
                            aria-label={`Remove ${item.name}`}
                          >
                            <Trash2
                              size={18}
                              className="text-red-500"
                            />
                          </button>
                        </div>

                        <p className="text-sm text-gray-500">
                          ₹{item.price} / unit
                        </p>

                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-3 rounded-lg border">
                            <button
                              onClick={() => decreaseQuantity(item._id)}
                              className="p-2"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={15} />
                            </button>

                            <span className="font-bold">
                              {item.cartQuantity}
                            </span>

                            <button
                              onClick={() => increaseQuantity(item._id)}
                              disabled={
                                item.cartQuantity >= item.availableStock
                              }
                              className="p-2 disabled:opacity-40"
                              aria-label="Increase quantity"
                            >
                              <Plus size={15} />
                            </button>
                          </div>

                          <span className="font-extrabold text-green-700">
                            ₹{Number(item.price) * item.cartQuantity}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t bg-[#F4FAF1] p-5">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Subtotal
                    </span>

                    <span className="text-xl font-extrabold">
                      ₹{cartTotal}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-gray-500">
                    Delivery charges are not included.
                  </p>

                  <button
                    onClick={handleCheckout}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-4 font-bold text-white hover:bg-green-700"
                  >
                    Proceed to Checkout
                    <ArrowRight size={19} />
                  </button>

                  <button
                    onClick={() => setCartOpen(false)}
                    className="mt-3 w-full rounded-xl border border-green-200 bg-white px-5 py-3 font-semibold text-green-700"
                  >
                    Continue Shopping
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      {/* CHECKOUT MODAL - CUSTOMER ONLY */}
      {checkoutOpen && currentUser && userRole === "customer" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/50 p-4">

        <div className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-8">
          
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-green-800">
                  Checkout 🌱
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Complete your delivery details.
                </p>
              </div>

              <button
                onClick={() => {
                  setCheckoutOpen(false);
                  setCheckoutItems(null);
                }}
                className="rounded-lg p-2 hover:bg-gray-100"
                disabled={placingOrder}
                aria-label="Close checkout"
              >
                <X size={23} />
              </button>
            </div>

            <form
              onSubmit={handlePlaceOrder}
              className="mt-6 space-y-4"
            >
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Customer Name
                </label>

                <input
                  type="text"
                  placeholder="Enter your full name"
                  required
                  value={deliveryDetails.customerName}
                  onChange={(event) =>
                    setDeliveryDetails({
                      ...deliveryDetails,
                      customerName: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-green-100 p-3 outline-none focus:border-green-500"
                />

                <p className="mt-1 text-xs text-gray-500">
                  Use the same name saved in your GraminConnect profile.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Phone Number
                </label>

                <input
                  type="tel"
                  placeholder="Enter 10-digit phone number"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  required
                  value={deliveryDetails.phone}
                  onChange={(event) =>
                    setDeliveryDetails({
                      ...deliveryDetails,
                      phone: event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10),
                    })
                  }
                  className="w-full rounded-xl border border-green-100 p-3 outline-none focus:border-green-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Delivery Address
                </label>

                <textarea
                  placeholder="House number, street, city, state and PIN code"
                  rows="3"
                  required
                  value={deliveryDetails.address}
                  onChange={(event) =>
                    setDeliveryDetails({
                      ...deliveryDetails,
                      address: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-green-100 p-3 outline-none focus:border-green-500"
                />
              </div>

              <div className="rounded-xl bg-green-50 p-4">
                <p className="font-bold text-green-900">
                  Payment Method
                </p>

                <p className="mt-2 flex items-center gap-2 text-green-700">
                  <Truck size={19} />
                  Cash on Delivery (COD)
                </p>
              </div>

              <div className="rounded-xl border border-green-100 p-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Total Items
                  </span>

                  <span className="font-semibold">
                    {orderItemCount}
                  </span>
                </div>

                <div className="mt-3 flex justify-between text-lg font-extrabold">
                  <span>Total Amount</span>

                  <span className="text-green-700">
                    ₹{orderTotal}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={placingOrder}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-4 font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {placingOrder ? (
                  <>
                    <RefreshCw
                      size={19}
                      className="animate-spin"
                    />
                    Placing Order...
                  </>
                ) : (
                  <>
                    Place Order
                    <ArrowRight size={19} />
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={placingOrder}
                onClick={() => {
                  setCheckoutItems(null);
                  setCheckoutOpen(false);
                  setCartOpen(true);
                }}
                className="w-full rounded-xl border border-green-200 py-3 font-semibold text-green-700 disabled:opacity-50"
              >
                Back to Cart
              </button>
            </form>
          </div>
        </div>
      )}

      {/* AI ASSISTANT AND FAQ */}
      <AIAssistant />
      <FAQ />

    </div>
  );
}

export default Home;