/* ====================== SUPABASE INIT ======================= */
const db = supabase.createClient(
    "https://oxaimnemcnqudtdguoyk.supabase.co",
    "sb_publishable_6p-lVAZg_ATPz1a1cDjlOg_9vIcR42c"
);

/* ====================== HEADER USER ======================= */
async function loadAdminHeader() {
    const adminId = localStorage.getItem("adminid");

    const { data } = await db
        .from("admin")
        .select("fullname")
        .eq("adminid", adminId)
        .single();

    document.getElementById("header-user").innerText =
        data ? `Xin chào, ${data.fullname}` : "Không tìm thấy admin";
}

/* ====================== NOTIFICATION ======================= */
function toggleNotification() {
    const box = document.getElementById("notif-dropdown");
    box.style.display = (box.style.display === "block" ? "none" : "block");
}

async function loadAdminNotifications() {
    const { data, error } = await db
        .from("notification")
        .select("*")
        .order("notification_id", { ascending: false });

    const list = document.getElementById("notif-list");
    const count = document.getElementById("notif-count");

    // Lỗi truy vấn
    if (error) {
        list.innerHTML = "<div class='notif-item'>Lỗi tải thông báo!</div>";
        count.style.display = "none";
        return;
    }

    // Không có thông báo
    if (!data || data.length === 0) {
        list.innerHTML = "<div class='notif-item'>Không có thông báo</div>";
        count.style.display = "none";
        return;
    }

    // Có thông báo → hiện badge số lượng
    count.style.display = "block";
    count.innerText = data.length;

    // Hiển thị danh sách thông báo theo format giống student
    list.innerHTML = data
        .map(n =>
            `<div class="notif-item">${n.message}</div>`
        )
        .join("");
}


/* ====================== LOGOUT CONTROL ======================= */
function openLogoutModal() {
    document.getElementById("logout-modal").style.display = "flex";
}
function closeLogoutModal() {
    document.getElementById("logout-modal").style.display = "none";
}
function logout() {
    localStorage.clear();
    window.location.href = "../index.html";
}

/* ====================== INIT ON EVERY PAGE ======================= */
window.addEventListener("DOMContentLoaded", () => {
    loadAdminHeader();
    loadAdminNotifications();
});

function toggleSidebarDropdown(el) {
    el.classList.toggle("open");

    const dropdown = el.nextElementSibling;
    if (!dropdown) return;

    dropdown.classList.toggle("open");
}

function showPopup(title, message) {
    document.getElementById("modal-title").innerText = title;
    document.getElementById("modal-message").innerText = message;
    document.getElementById("popupModal").style.display = "flex";
}

function closeModalInfo() {
    document.getElementById("popupModal").style.display = "none";
}