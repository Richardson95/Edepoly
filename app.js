// ===== Simple storage helpers (localStorage) =====
function load(key, def) {
  var data = localStorage.getItem(key);
  return data ? JSON.parse(data) : def;
}
function save(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

// ===== Default data =====
if (!localStorage.getItem("users")) {
  save("users", [
    { id: 1, name: "Administrator", email: "admin@fpa.edu.ng", password: "admin123", role: "admin", type: "Staff", phone: "08000000000" }
  ]);
}
// reset old emoji-based food list to the new image-based one
if (!localStorage.getItem("foods") || !localStorage.getItem("foodsV2")) {
  save("foods", [
    { id: 1, name: "Jollof Rice & Chicken", category: "Rice", price: 1500, image: "images/jollof.jpg", available: true },
    { id: 2, name: "Fried Rice & Turkey", category: "Rice", price: 1800, image: "images/friedrice.jpg", available: true },
    { id: 3, name: "Amala & Ewedu", category: "Swallow", price: 1200, image: "images/amala.jpg", available: true },
    { id: 4, name: "Pounded Yam & Egusi", category: "Swallow", price: 1500, image: "images/poundedyam.jpg", available: true },
    { id: 5, name: "Moi Moi", category: "Others", price: 700, image: "images/moimoi.jpg", available: true },
    { id: 6, name: "Spaghetti & Egg", category: "Others", price: 900, image: "images/spaghetti.jpg", available: true },
    { id: 7, name: "Meat Pie", category: "Snacks", price: 500, image: "images/meatpie.jpg", available: true },
    { id: 8, name: "Chilled Zobo", category: "Drinks", price: 300, image: "images/zobo.jpg", available: true }
  ]);
  save("foodsV2", true);
  save("cart", []);
}
var FOOD_INFO = {
  1: ["Smoky party jollof rice served with fried chicken.", 20],
  2: ["Nigerian fried rice with mixed veggies and turkey.", 20],
  3: ["Hot amala with ewedu, gbegiri and stew.", 15],
  4: ["Smooth pounded yam with rich egusi soup.", 20],
  5: ["Steamed bean pudding with egg and fish.", 10],
  6: ["Stir-fried spaghetti served with boiled egg.", 15],
  7: ["Freshly baked pie filled with minced meat.", 5],
  8: ["Chilled hibiscus drink with ginger and pineapple.", 5]
};
(function addFoodInfo() {
  var foods = load("foods", []);
  foods.forEach(function (f) {
    if (!f.desc && FOOD_INFO[f.id]) { f.desc = FOOD_INFO[f.id][0]; f.time = FOOD_INFO[f.id][1]; }
  });
  save("foods", foods);
})();

var DEFAULT_IMG = "images/default.jpg";
function foodImg(f, cls) {
  return '<img class="' + cls + '" src="' + (f.image || DEFAULT_IMG) + '" alt="' + f.name + '" onerror="this.src=\'' + DEFAULT_IMG + '\'">';
}
if (!localStorage.getItem("orders")) save("orders", []);
if (!localStorage.getItem("settings")) {
  save("settings", { cafeteria: "FPA Central Cafeteria", deliveryFee: 200, open: true });
}

var currentUser = load("currentUser", null);
var cart = load("cart", []);
var adminTab = "dashboard";

function naira(n) { return "₦" + Number(n).toLocaleString(); }

function toast(msg) {
  var t = document.getElementById("toast");
  t.textContent = msg;
  t.style.display = "block";
  setTimeout(function () { t.style.display = "none"; }, 2500);
}

// ===== Navigation =====
var currentPage = "home";

function renderNav() {
  var nav = document.getElementById("nav");
  var cartCount = cart.reduce(function (n, c) { return n + c.qty; }, 0);
  var html = '<a onclick="go(\'home\')"><i class="fa-solid fa-house"></i> Home</a><a onclick="go(\'menu\')"><i class="fa-solid fa-utensils"></i> Menu</a>';
  if (currentUser) {
    if (currentUser.role === "admin") {
      html += '<a onclick="go(\'admin\')"><i class="fa-solid fa-gauge"></i> Admin Panel</a>';
    } else {
      html += '<a onclick="go(\'cart\')"><i class="fa-solid fa-cart-shopping"></i> Cart <span class="badge">' + cartCount + '</span></a>';
      html += '<a onclick="go(\'orders\')"><i class="fa-solid fa-receipt"></i> My Orders</a>';
    }
    html += '<a onclick="go(\'profile\')"><i class="fa-solid fa-circle-user"></i> ' + currentUser.name.split(" ")[0] + '</a>';
    html += '<a onclick="logout()" title="Logout"><i class="fa-solid fa-right-from-bracket"></i> Logout</a>';
  } else {
    html += '<a onclick="go(\'login\')"><i class="fa-solid fa-right-to-bracket"></i> Login</a><a onclick="go(\'register\')"><i class="fa-solid fa-user-plus"></i> Register</a>';
  }
  nav.innerHTML = html;
  // highlight the current page link
  var links = nav.querySelectorAll("a");
  for (var i = 0; i < links.length; i++) {
    if ((links[i].getAttribute("onclick") || "").indexOf("'" + currentPage + "'") !== -1) links[i].className = "active";
  }
}

function go(page) {
  location.hash = page;
}

window.addEventListener("hashchange", render);

function render() {
  var page = location.hash.replace("#", "") || "home";
  var app = document.getElementById("app");

  if ((page === "cart" || page === "orders" || page === "profile") && !currentUser) page = "login";
  if (page === "admin" && (!currentUser || currentUser.role !== "admin")) page = "login";
  currentPage = page;
  renderNav();
  window.scrollTo(0, 0);

  if (page === "home") app.innerHTML = homePage();
  else if (page === "menu") app.innerHTML = menuPage();
  else if (page === "login") app.innerHTML = loginPage();
  else if (page === "register") app.innerHTML = registerPage();
  else if (page === "cart") app.innerHTML = cartPage();
  else if (page === "orders") app.innerHTML = ordersPage();
  else if (page === "admin") app.innerHTML = adminPage();
  else if (page === "profile") app.innerHTML = profilePage();
  else app.innerHTML = homePage();
}

// ===== Pages =====
function homePage() {
  var s = load("settings", {});
  var popular = load("foods", []).filter(function (f) { return f.available; }).slice(0, 4);
  return '' +
    '<div class="hero">' +
      '<span class="open-tag ' + (s.open ? 'open' : 'closed') + '"><i class="fa-solid fa-store"></i> ' + s.cafeteria + ' is ' + (s.open ? 'OPEN' : 'CLOSED') + '</span>' +
      '<h1>Hungry? Order Your Meal Online</h1>' +
      '<p>Food ordering for staff &amp; students of Federal Polytechnic Ayede. No more long queues or far distances, order and get it delivered to your hostel or office.</p>' +
      '<button class="btn" onclick="go(\'menu\')"><i class="fa-solid fa-utensils"></i> Order Now</button> ' +
      (currentUser ? '' : '<button class="btn outline" onclick="go(\'register\')"><i class="fa-solid fa-user-plus"></i> Create Account</button>') +
    '</div>' +

    '<h2 class="section-title">Why Order With Us</h2>' +
    '<div class="features">' +
      '<div class="card"><div><i class="fa-solid fa-book-open"></i></div><h3>Browse Foods</h3><p class="muted">See all available meals and prices.</p></div>' +
      '<div class="card"><div><i class="fa-solid fa-cart-plus"></i></div><h3>Make Orders</h3><p class="muted">Add to cart and place your order fast.</p></div>' +
      '<div class="card"><div><i class="fa-solid fa-truck-fast"></i></div><h3>Track Delivery</h3><p class="muted">Follow your order status in real time.</p></div>' +
      '<div class="card"><div><i class="fa-solid fa-circle-check"></i></div><h3>Confirmation</h3><p class="muted">Receive confirmation of all transactions.</p></div>' +
    '</div>' +

    '<h2 class="section-title">Popular Dishes</h2>' +
    '<div class="grid">' + foodCards(popular) + '</div>' +
    '<div style="text-align:center;margin:20px 0 10px"><button class="btn green" onclick="go(\'menu\')">View Full Menu <i class="fa-solid fa-arrow-right"></i></button></div>' +

    '<h2 class="section-title">What People Say</h2>' +
    '<div class="features">' +
      '<div class="card review"><p>"I no longer queue at the cafeteria between lectures. I order from class and it meets me at the hostel."</p><b>- ND II Student</b></div>' +
      '<div class="card review"><p>"Very easy to use. I order lunch to my office and track it until it arrives."</p><b>- Staff, Bursary Unit</b></div>' +
      '<div class="card review"><p>"The receipt and order tracking make everything clear. No more arguments about payment."</p><b>- HND I Student</b></div>' +
    '</div>' +
    '<h2 class="section-title">How It Works</h2>' +
    '<div class="steps">' +
      '<div class="step"><span>1</span><h4>Register / Login</h4><p class="muted">Sign up with your Matric No or Staff ID.</p></div>' +
      '<div class="step"><span>2</span><h4>Choose Food</h4><p class="muted">Pick your favourite meals from the menu.</p></div>' +
      '<div class="step"><span>3</span><h4>Place Order</h4><p class="muted">Enter your location and confirm.</p></div>' +
      '<div class="step"><span>4</span><h4>Get Delivered</h4><p class="muted">Track it until it reaches you.</p></div>' +
    '</div>';
}

function menuPage() {
  var foods = load("foods", []).filter(function (f) { return f.available; });
  var cats = ["All"];
  foods.forEach(function (f) { if (cats.indexOf(f.category) === -1) cats.push(f.category); });

  menuCat = "All";
  var html = '<h2>Our Menu</h2>' +
    '<div class="search-box"><i class="fa-solid fa-magnifying-glass"></i><input id="search" placeholder="Search food..." oninput="filterMenu()"></div>' +
    '<div class="pills">' +
      cats.map(function (c) {
        return '<button class="pill ' + (c === "All" ? 'active' : '') + '" onclick="pickCat(this, \'' + c + '\')">' + c + '</button>';
      }).join("") +
    '</div><div class="grid" id="foodGrid">' + foodCards(foods) + '</div>';
  return html;
}

var menuCat = "All";
function pickCat(btn, c) {
  menuCat = c;
  var pills = document.querySelectorAll(".pill");
  for (var i = 0; i < pills.length; i++) pills[i].classList.remove("active");
  btn.classList.add("active");
  filterMenu();
}

function foodCards(foods) {
  if (foods.length === 0) return '<p class="muted">No food found.</p>';
  return foods.map(function (f) {
    return '<div class="food">' +
      foodImg(f, 'food-img') +
      '<div class="info">' +
        '<h3>' + f.name + '</h3>' +
        '<div class="cat">' + f.category + '</div>' +
        (f.desc ? '<p class="desc">' + f.desc + '</p>' : '') +
        '<div class="price-row"><span class="price">' + naira(f.price) + '</span>' +
        '<span class="time"><i class="fa-regular fa-clock"></i> ' + (f.time || 15) + ' mins</span></div>' +
        '<button class="btn green" onclick="addToCart(' + f.id + ')"><i class="fa-solid fa-cart-plus"></i> Add to Cart</button>' +
      '</div></div>';
  }).join("");
}

function filterMenu() {
  var q = document.getElementById("search").value.toLowerCase();
  var c = menuCat;
  var foods = load("foods", []).filter(function (f) {
    return f.available && f.name.toLowerCase().indexOf(q) !== -1 && (c === "All" || f.category === c);
  });
  document.getElementById("foodGrid").innerHTML = foodCards(foods);
}

function loginPage() {
  return '<div class="card form-box">' +
    '<h2>Login</h2>' +
    '<label>Email</label><input id="lemail" type="email">' +
    '<label>Password</label><div class="pass-box"><input id="lpass" type="password"><i class="fa-solid fa-eye" onclick="togglePass(this)"></i></div>' +
    '<button class="btn green" onclick="login()"><i class="fa-solid fa-right-to-bracket"></i> Login</button>' +
    '<p class="muted" style="margin-top:15px">No account? <a href="#register">Register here</a></p>' +
    '<p class="muted">Admin demo: admin@fpa.edu.ng / admin123</p>' +
  '</div>';
}

function registerPage() {
  return '<div class="card form-box">' +
    '<h2>Create Account</h2>' +
    '<label>Full Name</label><input id="rname">' +
    '<label>Email</label><input id="remail" type="email">' +
    '<label>Phone</label><input id="rphone">' +
    '<label>I am a</label><select id="rtype"><option>Student</option><option>Staff</option></select>' +
    '<label>Matric No / Staff ID</label><input id="rid">' +
    '<label>Password</label><div class="pass-box"><input id="rpass" type="password"><i class="fa-solid fa-eye" onclick="togglePass(this)"></i></div>' +
    '<button class="btn green" onclick="register()"><i class="fa-solid fa-user-plus"></i> Register</button>' +
  '</div>';
}

function cartPage() {
  if (cart.length === 0) {
    return '<h2>My Cart</h2><div class="card"><p class="muted">Your cart is empty.</p><br><button class="btn" onclick="go(\'menu\')">Go to Menu</button></div>';
  }
  var s = load("settings", {});
  var subtotal = 0;
  var rows = cart.map(function (item, i) {
    var line = item.price * item.qty;
    subtotal += line;
    return '<tr><td>' + foodImg(item, 'thumb') + ' ' + item.name + '</td><td>' + naira(item.price) + '</td>' +
      '<td><button class="btn small" onclick="changeQty(' + i + ',-1)"><i class="fa-solid fa-minus"></i></button> ' + item.qty +
      ' <button class="btn small" onclick="changeQty(' + i + ',1)"><i class="fa-solid fa-plus"></i></button></td>' +
      '<td>' + naira(line) + '</td>' +
      '<td><button class="btn small red" onclick="removeItem(' + i + ')"><i class="fa-solid fa-trash"></i></button></td></tr>';
  }).join("");

  return '<h2>My Cart</h2><div class="card">' +
    '<table><tr><th>Food</th><th>Price</th><th>Qty</th><th>Total</th><th></th></tr>' + rows + '</table>' +
    '<div class="total">Subtotal: ' + naira(subtotal) + '<br>Delivery Fee: ' + naira(s.deliveryFee) +
    '<br>Grand Total: ' + naira(subtotal + Number(s.deliveryFee)) + '</div>' +
    '<label>Delivery Location (e.g. Hostel, Office, Department)</label><input id="location">' +
    '<label>Special Instructions (optional)</label><textarea id="note" rows="2" placeholder="e.g. No pepper, extra meat, call when you arrive"></textarea>' +
    '<p class="eta"><i class="fa-solid fa-motorcycle"></i> Estimated delivery time: <b>' + (Math.max.apply(null, cart.map(function (c) { return c.time || 15; })) + 15) + ' - ' + (Math.max.apply(null, cart.map(function (c) { return c.time || 15; })) + 30) + ' mins</b></p>' +
    '<label>Payment Method</label><select id="payment"><option>Pay on Delivery</option><option>Bank Transfer</option></select>' +
    '<button class="btn green" onclick="placeOrder()"><i class="fa-solid fa-check"></i> Place Order</button>' +
  '</div>';
}

function ordersPage() {
  var orders = load("orders", []).filter(function (o) { return o.userId === currentUser.id; }).reverse();
  if (orders.length === 0) return '<h2>My Orders</h2><div class="card"><p class="muted">You have not placed any order yet.</p><br><button class="btn" onclick="go(\'menu\')">Order Now</button></div>';
  var steps = ["Pending", "Preparing", "Out for Delivery", "Delivered"];
  var icons = ["fa-clock", "fa-fire-burner", "fa-motorcycle", "fa-house-circle-check"];
  return '<h2>My Orders &amp; Delivery Status</h2>' + orders.map(function (o) {
    var current = steps.indexOf(o.status);
    var tracker = o.status === "Cancelled"
      ? '<p class="cancelled-note"><i class="fa-solid fa-ban"></i> This order was cancelled.</p>'
      : '<div class="tracker">' + steps.map(function (st, i) {
          return '<div class="track-step ' + (i <= current ? 'done' : '') + '"><i class="fa-solid ' + icons[i] + '"></i><small>' + st + '</small></div>';
        }).join("") + '</div>';
    return '<div class="card order-card">' +
      '<div class="order-head"><b>Order #' + o.id + '</b><span class="status ' + o.status.replace(/ /g, "-") + '">' + o.status + '</span></div>' +
      '<p class="muted"><i class="fa-regular fa-calendar"></i> ' + o.date + ' &nbsp; <i class="fa-solid fa-location-dot"></i> ' + o.location + ' &nbsp; <i class="fa-solid fa-wallet"></i> ' + o.payment + '</p>' +
      (o.note ? '<p class="muted"><i class="fa-solid fa-note-sticky"></i> ' + o.note + '</p>' : '') +
      '<p style="margin:8px 0">' + o.items.map(function (i) { return i.name + ' x' + i.qty; }).join(", ") + '</p>' +
      tracker +
      '<div class="order-foot"><b>Total: ' + naira(o.total) + '</b><div>' +
      '<button class="btn small green" onclick="showReceipt(' + o.id + ')"><i class="fa-solid fa-file-invoice"></i> Receipt</button> ' +
      (o.status === "Pending" ? '<button class="btn small red" onclick="cancelOrder(' + o.id + ')"><i class="fa-solid fa-xmark"></i> Cancel</button>' : '') +
      '</div></div></div>';
  }).join("");
}

// ===== Receipt (order confirmation) =====
function showReceipt(id) {
  var o = load("orders", []).find(function (x) { return x.id === id; });
  var s = load("settings", {});
  var rows = o.items.map(function (i) {
    return '<tr><td>' + i.name + '</td><td>' + i.qty + '</td><td>' + naira(i.price * i.qty) + '</td></tr>';
  }).join("");
  var box = document.getElementById("modal");
  box.innerHTML = '<div class="modal-box" id="receipt">' +
    '<div class="receipt-head"><i class="fa-solid fa-circle-check"></i><h3>Order Confirmed</h3>' +
    '<p class="muted">' + s.cafeteria + ' - Federal Polytechnic Ayede</p></div>' +
    '<p><b>Order ID:</b> #' + o.id + '</p>' +
    '<p><b>Customer:</b> ' + o.userName + '</p>' +
    '<p><b>Date:</b> ' + o.date + '</p>' +
    '<p><b>Delivery to:</b> ' + o.location + '</p>' +
    '<p><b>Payment:</b> ' + o.payment + '</p>' +
    (o.note ? '<p><b>Note:</b> ' + o.note + '</p>' : '') +
    '<p><b>Status:</b> ' + o.status + '</p>' +
    '<table style="min-width:0;margin:12px 0"><tr><th>Item</th><th>Qty</th><th>Amount</th></tr>' + rows +
    '<tr><td colspan="2">Delivery Fee</td><td>' + naira(o.total - o.items.reduce(function (n, i) { return n + i.price * i.qty; }, 0)) + '</td></tr>' +
    '<tr><th colspan="2">Total</th><th>' + naira(o.total) + '</th></tr></table>' +
    '<p class="muted" style="text-align:center">Thank you for your order!</p>' +
    '<div class="modal-actions no-print">' +
      '<button class="btn green" onclick="window.print()"><i class="fa-solid fa-print"></i> Print</button> ' +
      '<button class="btn" onclick="closeModal()">Close</button>' +
    '</div></div>';
  box.style.display = "flex";
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}

// ===== Profile =====
function profilePage() {
  var myOrders = load("orders", []).filter(function (o) { return o.userId === currentUser.id; });
  var spent = myOrders.reduce(function (n, o) { return n + (o.status === "Cancelled" ? 0 : o.total); }, 0);
  return '<h2>My Profile</h2>' +
    '<div class="profile-top card">' +
      '<div class="avatar">' + currentUser.name.charAt(0).toUpperCase() + '</div>' +
      '<div><h3>' + currentUser.name + '</h3><p class="muted">' + currentUser.email + ' &middot; ' + currentUser.type +
      (currentUser.idNo ? ' &middot; ' + currentUser.idNo : '') + '</p></div>' +
    '</div>' +
    (currentUser.role === "admin" ? '' :
    '<div class="stats">' +
      '<div class="card"><b>' + myOrders.length + '</b><i class="fa-solid fa-receipt"></i> Orders Made</div>' +
      '<div class="card"><b>' + naira(spent) + '</b><i class="fa-solid fa-wallet"></i> Total Spent</div>' +
    '</div>') +
    '<div class="card form-box">' +
      '<h3>Edit Details</h3><br>' +
      '<label>Full Name</label><input id="pname" value="' + currentUser.name + '">' +
      '<label>Phone</label><input id="pphone" value="' + (currentUser.phone || '') + '">' +
      '<label>New Password (leave empty to keep old)</label><div class="pass-box"><input id="ppass" type="password"><i class="fa-solid fa-eye" onclick="togglePass(this)"></i></div>' +
      '<button class="btn green" onclick="saveProfile()"><i class="fa-solid fa-floppy-disk"></i> Save Changes</button>' +
    '</div>';
}

function saveProfile() {
  var name = document.getElementById("pname").value.trim();
  if (!name) return toast("Name cannot be empty");
  var users = load("users", []);
  users.forEach(function (u) {
    if (u.id === currentUser.id) {
      u.name = name;
      u.phone = document.getElementById("pphone").value;
      var pass = document.getElementById("ppass").value;
      if (pass) u.password = pass;
      currentUser = u;
    }
  });
  save("users", users);
  save("currentUser", currentUser);
  toast("Profile updated");
  render();
}

function cancelOrder(id) {
  if (!confirm("Cancel this order?")) return;
  updateStatus(id, "Cancelled");
  render();
}

// ===== Admin =====
function adminPage() {
  var tabs = ["dashboard", "orders", "foods", "users", "settings"];
  var tabIcons = { dashboard: "fa-chart-line", orders: "fa-receipt", foods: "fa-bowl-food", users: "fa-users", settings: "fa-gear" };
  var html = '<h2>Admin Panel</h2><div class="tabs">' + tabs.map(function (t) {
    return '<button class="' + (adminTab === t ? 'active' : '') + '" onclick="setTab(\'' + t + '\')">' +
      '<i class="fa-solid ' + tabIcons[t] + '"></i> ' + t.charAt(0).toUpperCase() + t.slice(1) + '</button>';
  }).join("") + '</div>';

  if (adminTab === "dashboard") html += adminDashboard();
  if (adminTab === "orders") html += adminOrders();
  if (adminTab === "foods") html += adminFoods();
  if (adminTab === "users") html += adminUsers();
  if (adminTab === "settings") html += adminSettings();
  return html;
}

function setTab(t) { adminTab = t; render(); }

function adminDashboard() {
  var orders = load("orders", []);
  var revenue = 0, pending = 0, todayCount = 0, todaySales = 0;
  var today = new Date().toLocaleDateString();
  orders.forEach(function (o) {
    if (o.day === today) {
      todayCount++;
      if (o.status !== "Cancelled") todaySales += o.total;
    }
    if (o.status === "Delivered") revenue += o.total;
    if (o.status === "Pending") pending++;
  });
  return '<div class="stats">' +
    '<div class="card"><b>' + load("users", []).length + '</b><i class="fa-solid fa-users"></i> Users</div>' +
    '<div class="card"><b>' + load("foods", []).length + '</b><i class="fa-solid fa-bowl-food"></i> Food Items</div>' +
    '<div class="card"><b>' + orders.length + '</b><i class="fa-solid fa-receipt"></i> Total Orders</div>' +
    '<div class="card"><b>' + pending + '</b><i class="fa-solid fa-clock"></i> Pending Orders</div>' +
    '<div class="card"><b>' + todayCount + '</b><i class="fa-solid fa-calendar-day"></i> Orders Today</div>' +
    '<div class="card"><b>' + naira(todaySales) + '</b><i class="fa-solid fa-sack-dollar"></i> Sales Today</div>' +
    '<div class="card"><b>' + naira(revenue) + '</b><i class="fa-solid fa-money-bill-wave"></i> Revenue (Delivered)</div>' +
  '</div>' + topFoods(orders) + recentOrders(orders);
}

function topFoods(orders) {
  var count = {};
  orders.forEach(function (o) {
    if (o.status === "Cancelled") return;
    o.items.forEach(function (i) { count[i.name] = (count[i.name] || 0) + i.qty; });
  });
  var list = Object.keys(count).sort(function (a, b) { return count[b] - count[a]; }).slice(0, 5);
  if (list.length === 0) return '';
  var max = count[list[0]];
  return '<div class="card"><h3><i class="fa-solid fa-fire"></i> Top Selling Foods</h3><br>' +
    list.map(function (name) {
      return '<div class="bar-row"><span>' + name + '</span><div class="bar"><div style="width:' + (count[name] / max * 100) + '%"></div></div><b>' + count[name] + '</b></div>';
    }).join("") + '</div>';
}

function recentOrders(orders) {
  var recent = orders.slice(-5).reverse();
  if (recent.length === 0) return '<div class="card"><p class="muted">No orders yet.</p></div>';
  return '<div class="card"><h3><i class="fa-solid fa-clock-rotate-left"></i> Recent Orders</h3><br><table>' +
    '<tr><th>ID</th><th>Customer</th><th>Total</th><th>Date</th><th>Status</th></tr>' +
    recent.map(function (o) {
      return '<tr><td>#' + o.id + '</td><td>' + o.userName + '</td><td>' + naira(o.total) + '</td><td>' + o.date +
        '</td><td><span class="status ' + o.status.replace(/ /g, "-") + '">' + o.status + '</span></td></tr>';
    }).join("") + '</table></div>';
}

var orderFilter = "All";
function setOrderFilter(v) { orderFilter = v; render(); }

function adminOrders() {
  var statuses = ["Pending", "Preparing", "Out for Delivery", "Delivered", "Cancelled"];
  var filterBox = '<div class="filter"><select onchange="setOrderFilter(this.value)">' +
    ["All"].concat(statuses).map(function (s) { return '<option ' + (s === orderFilter ? 'selected' : '') + '>' + s + '</option>'; }).join("") +
    '</select></div>';
  var orders = load("orders", []).slice().reverse().filter(function (o) { return orderFilter === "All" || o.status === orderFilter; });
  if (orders.length === 0) return filterBox + '<div class="card"><p class="muted">No orders found.</p></div>';
  var rows = orders.map(function (o) {
    return '<tr><td>#' + o.id + '</td><td>' + o.userName + '</td><td>' +
      o.items.map(function (i) { return i.name + ' x' + i.qty; }).join(", ") + '</td><td>' + naira(o.total) +
      (o.note ? '<br><small class="muted">Note: ' + o.note + '</small>' : '') + '</td><td>' + o.location + '</td><td>' + o.payment +
      '<br><a class="link" onclick="showReceipt(' + o.id + ')">View receipt</a></td><td><select onchange="updateStatus(' + o.id + ', this.value)">' +
      statuses.map(function (s) { return '<option ' + (s === o.status ? 'selected' : '') + '>' + s + '</option>'; }).join("") +
      '</select></td></tr>';
  }).join("");
  return filterBox + '<div class="card"><table><tr><th>ID</th><th>Customer</th><th>Items</th><th>Total</th><th>Location</th><th>Payment</th><th>Status</th></tr>' + rows + '</table></div>';
}

function adminFoods() {
  var foods = load("foods", []);
  var rows = foods.map(function (f) {
    return '<tr><td>' + foodImg(f, 'thumb') + '</td><td>' + f.name + '</td><td>' + f.category + '</td><td>' + naira(f.price) +
      '</td><td>' + (f.available ? 'Yes' : 'No') + '</td><td>' +
      '<button class="btn small green" onclick="editPrice(' + f.id + ')"><i class="fa-solid fa-pen"></i> Price</button> ' +
      '<button class="btn small" onclick="toggleFood(' + f.id + ')"><i class="fa-solid ' + (f.available ? 'fa-eye-slash' : 'fa-eye') + '"></i> ' + (f.available ? 'Hide' : 'Show') + '</button> ' +
      '<button class="btn small red" onclick="deleteFood(' + f.id + ')"><i class="fa-solid fa-trash"></i> Delete</button></td></tr>';
  }).join("");
  return '<div class="card"><h3>Add Food Item</h3><br>' +
    '<label>Name</label><input id="fname">' +
    '<label>Category</label><select id="fcat"><option>Rice</option><option>Swallow</option><option>Snacks</option><option>Drinks</option><option>Others</option></select>' +
    '<label>Price (₦)</label><input id="fprice" type="number">' +
    '<label>Short Description</label><input id="fdesc" placeholder="e.g. Served with plantain">' +
    '<label>Preparation Time (mins)</label><input id="ftime" type="number" value="15">' +
    '<label>Food Image</label><input id="fimage" type="file" accept="image/*">' +
    '<button class="btn green" onclick="addFood()"><i class="fa-solid fa-plus"></i> Add Food</button></div>' +
    '<div class="card"><table><tr><th></th><th>Name</th><th>Category</th><th>Price</th><th>Available</th><th>Action</th></tr>' + rows + '</table></div>';
}

function adminUsers() {
  var users = load("users", []);
  var rows = users.map(function (u) {
    return '<tr><td>' + u.name + '</td><td>' + u.email + '</td><td>' + (u.phone || '') + '</td><td>' + u.type +
      '</td><td>' + (u.idNo || '-') + '</td><td>' + u.role + '</td><td>' +
      (u.role === 'admin' ? '' : '<button class="btn small red" onclick="deleteUser(' + u.id + ')"><i class="fa-solid fa-trash"></i> Delete</button>') + '</td></tr>';
  }).join("");
  return '<div class="card"><table><tr><th>Name</th><th>Email</th><th>Phone</th><th>Type</th><th>Matric/Staff ID</th><th>Role</th><th></th></tr>' + rows + '</table></div>';
}

function adminSettings() {
  var s = load("settings", {});
  return '<div class="card form-box">' +
    '<label>Cafeteria Name</label><input id="scaf" value="' + s.cafeteria + '">' +
    '<label>Delivery Fee (₦)</label><input id="sfee" type="number" value="' + s.deliveryFee + '">' +
    '<label>Cafeteria Status</label><select id="sopen"><option value="1" ' + (s.open ? 'selected' : '') + '>Open</option><option value="0" ' + (!s.open ? 'selected' : '') + '>Closed</option></select>' +
    '<button class="btn green" onclick="saveSettings()"><i class="fa-solid fa-floppy-disk"></i> Save Settings</button></div>';
}

// ===== Actions =====
function register() {
  var name = document.getElementById("rname").value.trim();
  var email = document.getElementById("remail").value.trim().toLowerCase();
  var pass = document.getElementById("rpass").value;
  if (!name || !email || !pass) return toast("Please fill all required fields");
  var users = load("users", []);
  if (users.some(function (u) { return u.email === email; })) return toast("Email already registered");
  var user = {
    id: Date.now(), name: name, email: email, password: pass, role: "user",
    phone: document.getElementById("rphone").value,
    type: document.getElementById("rtype").value,
    idNo: document.getElementById("rid").value
  };
  users.push(user);
  save("users", users);
  toast("Registration successful! Please login.");
  go("login");
}

function login() {
  var email = document.getElementById("lemail").value.trim().toLowerCase();
  var pass = document.getElementById("lpass").value;
  var user = load("users", []).find(function (u) { return u.email === email && u.password === pass; });
  if (!user) return toast("Invalid email or password");
  currentUser = user;
  save("currentUser", user);
  toast("Welcome, " + user.name);
  go(user.role === "admin" ? "admin" : "menu");
}

function logout() {
  currentUser = null;
  cart = [];
  localStorage.removeItem("currentUser");
  save("cart", cart);
  go("home");
  render();
}

function addToCart(id) {
  if (!currentUser) { toast("Please login to order"); return go("login"); }
  if (currentUser.role === "admin") return toast("Admin cannot place orders");
  if (!load("settings", {}).open) return toast("Cafeteria is currently closed");
  var food = load("foods", []).find(function (f) { return f.id === id; });
  var existing = cart.find(function (c) { return c.id === id; });
  if (existing) existing.qty++;
  else cart.push({ id: food.id, name: food.name, price: food.price, image: food.image, time: food.time, qty: 1 });
  save("cart", cart);
  renderNav();
  var badge = document.querySelector(".badge");
  if (badge) badge.classList.add("bounce");
  toast(food.name + " added to cart");
}

function changeQty(i, d) {
  cart[i].qty += d;
  if (cart[i].qty < 1) cart.splice(i, 1);
  save("cart", cart);
  render();
}

function removeItem(i) {
  cart.splice(i, 1);
  save("cart", cart);
  render();
}

function placeOrder() {
  var location_ = document.getElementById("location").value.trim();
  if (!location_) return toast("Please enter delivery location");
  var s = load("settings", {});
  var subtotal = cart.reduce(function (sum, c) { return sum + c.price * c.qty; }, 0);
  var orders = load("orders", []);
  var order = {
    id: orders.length + 1001,
    userId: currentUser.id,
    userName: currentUser.name,
    items: cart,
    total: subtotal + Number(s.deliveryFee),
    location: location_,
    payment: document.getElementById("payment").value,
    note: document.getElementById("note").value.trim(),
    status: "Pending",
    date: new Date().toLocaleString(),
    day: new Date().toLocaleDateString()
  };
  orders.push(order);
  save("orders", orders);
  cart = [];
  save("cart", cart);
  go("orders");
  showReceipt(order.id);
}

function editPrice(id) {
  var foods = load("foods", []);
  var food = foods.find(function (f) { return f.id === id; });
  var price = prompt("Enter new price for " + food.name + " (₦):", food.price);
  if (price === null) return;
  price = Number(price);
  if (!price || price < 0) return toast("Invalid price");
  food.price = price;
  save("foods", foods);
  toast("Price updated");
  render();
}

function updateStatus(id, status) {
  var orders = load("orders", []);
  orders.forEach(function (o) { if (o.id === id) o.status = status; });
  save("orders", orders);
  toast("Order #" + id + " updated to " + status);
}

function addFood() {
  var name = document.getElementById("fname").value.trim();
  var price = Number(document.getElementById("fprice").value);
  if (!name || !price) return toast("Enter food name and price");
  var file = document.getElementById("fimage").files[0];
  var category = document.getElementById("fcat").value;
  var desc = document.getElementById("fdesc").value.trim();
  var time = Number(document.getElementById("ftime").value) || 15;

  function saveFood(image) {
    var foods = load("foods", []);
    foods.push({ id: Date.now(), name: name, price: price, available: true, category: category, image: image, desc: desc, time: time });
    try { save("foods", foods); } catch (e) { return toast("Image too large, use a smaller image"); }
    toast("Food added");
    render();
  }

  if (file) {
    var reader = new FileReader();
    reader.onload = function () { saveFood(reader.result); };
    reader.readAsDataURL(file);
  } else {
    saveFood(DEFAULT_IMG);
  }
}

function toggleFood(id) {
  var foods = load("foods", []);
  foods.forEach(function (f) { if (f.id === id) f.available = !f.available; });
  save("foods", foods);
  render();
}

function deleteFood(id) {
  if (!confirm("Delete this food item?")) return;
  save("foods", load("foods", []).filter(function (f) { return f.id !== id; }));
  render();
}

function deleteUser(id) {
  if (!confirm("Delete this user?")) return;
  save("users", load("users", []).filter(function (u) { return u.id !== id; }));
  render();
}

function saveSettings() {
  save("settings", {
    cafeteria: document.getElementById("scaf").value,
    deliveryFee: Number(document.getElementById("sfee").value),
    open: document.getElementById("sopen").value === "1"
  });
  toast("Settings saved");
}

render();

// ===== Small helpers =====
function togglePass(icon) {
  var input = icon.previousElementSibling;
  var show = input.type === "password";
  input.type = show ? "text" : "password";
  icon.className = "fa-solid " + (show ? "fa-eye-slash" : "fa-eye");
}

// back to top button
window.addEventListener("scroll", function () {
  document.getElementById("toTop").style.display = window.scrollY > 300 ? "block" : "none";
});
