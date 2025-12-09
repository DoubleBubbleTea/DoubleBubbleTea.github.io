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
    const adminId = localStorage.getItem("adminid");

    const { data } = await db
        .from("admin_notifications")
        .select("*")
        .eq("adminid", adminId)
        .order("created_at", { ascending: false });

    const list = document.getElementById("notif-list");
    const count = document.getElementById("notif-count");

    if (!data || data.length === 0) {
        list.innerHTML = "Không có thông báo!";
        count.style.display = "none";
        return;
    }

    count.style.display = "block";
    count.innerText = data.length;

    list.innerHTML = data
        .map(n =>
            `<div style="padding:6px 0;border-bottom:1px solid #eee;">
                ${n.message}
            </div>`
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
