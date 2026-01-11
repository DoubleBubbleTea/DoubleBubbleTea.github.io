/* ====================== SUPABASE INIT ======================= */
const db = supabase.createClient(
    "https://oxaimnemcnqudtdguoyk.supabase.co",
    "sb_publishable_6p-lVAZg_ATPz1a1cDjlOg_9vIcR42c"
);
function toLocalTimestampString(date) {
    const pad = (n) => n.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
        `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
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
        .select("notification_id, message, type, notidate")
        .eq("scope", "Tất cả")
        .order("notification_id", { ascending: false });

    const list = document.getElementById("notif-list");
    const count = document.getElementById("notif-count");

    // ❌ Lỗi truy vấn
    if (error) {
        console.error(error);
        list.innerHTML = `
            <div class="notif-item">
                <div class="notif-mini-icon warning">
                    <i class="fa fa-exclamation"></i>
                </div>
                <div class="notif-content">
                    <div class="notif-item-title">Lỗi tải thông báo</div>
                </div>
            </div>`;
        count.style.display = "none";
        return;
    }

    // ℹ️ Không có thông báo
    if (!data || data.length === 0) {
        list.innerHTML = `
            <div class="notif-item">
                <div class="notif-mini-icon info">
                    <i class="fa fa-bullhorn"></i>
                </div>
                <div class="notif-content">
                    <div class="notif-item-title">Không có thông báo chung</div>
                </div>
            </div>`;
        count.style.display = "none";
        return;
    }
    const TYPE_MAP = {
        "Xác nhận": { cls: "confirm", icon: "fa-check" },
        "Cảnh báo": { cls: "warning", icon: "fa-exclamation" },
        "Nhắc nhở": { cls: "remind", icon: "fa-bullhorn" },
        "Thông tin": { cls: "info", icon: "fa-bullhorn" }
    };
    // ✅ Hiện badge số lượng
    count.style.display = "block";
    count.innerText = data.length;

    // ✅ Render notification
    list.innerHTML = data.map(n => {
        const t = TYPE_MAP[n.type] || TYPE_MAP["Thông tin"];

        const dateText = n.notidate
            ? new Date(n.notidate).toLocaleDateString("vi-VN")
            : "";

        return `
            <div class="notif-item">
                <div class="notif-mini-icon ${t.cls}">
                    <i class="fa ${t.icon}"></i>
                </div>
                <div class="notif-content">
                    <div class="notif-item-title">${n.message}</div>
                    <div class="notif-item-time">${dateText}</div>
                </div>
            </div>
        `;
    }).join("");
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

function toggleSidebarDropdown(toggleEl) {
    const dropdown = toggleEl.nextElementSibling;
    const isOpen = dropdown.classList.contains("open");

    if (isOpen) {
        // 🔽 Thu gọn
        dropdown.classList.remove("open");
        toggleEl.classList.remove("open");
        localStorage.setItem("sidebarDanhSachOpen", "false");
    } else {
        // 🔼 Xổ xuống
        dropdown.classList.add("open");
        toggleEl.classList.add("open");
        localStorage.setItem("sidebarDanhSachOpen", "true");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const isOpen = localStorage.getItem("sidebarDanhSachOpen");
    if (isOpen === "true") {
        const toggleEl = document.querySelector(".sidebar-dropdown-toggle");
        const dropdown = document.querySelector(".sidebar-dropdown");

        if (toggleEl && dropdown) {
            toggleEl.classList.add("open");
            dropdown.classList.add("open");
        }
    }
});

function showPopup(title, message) {
    document.getElementById("modal-title").innerText = title;
    document.getElementById("modal-message").innerText = message;
    document.getElementById("popupModal").style.display = "flex";
}

function closeModalInfo() {
    document.getElementById("popupModal").style.display = "none";
}

async function insertNotification(studentId, message, type = "Thông tin") {
    if (!studentId || !message) {
        showPopup(
            "Lỗi",
            "Thiếu thông tin sinh viên hoặc nội dung thông báo."
        );
        return;
    }

    // validate type
    if (!["Thông tin", "Cảnh báo"].includes(type)) {
        type = "Thông tin";
    }

    // 1️⃣ Lấy fullname từ bảng student
    const { data: student, error: studentError } = await db
        .from("student")
        .select("fullname")
        .eq("studentid", studentId)
        .single();

    if (studentError || !student) {
        showPopup(
            "Lỗi",
            "Không tìm thấy thông tin sinh viên."
        );
        return;
    }

    // 2️⃣ Insert notification (có type)
    const { error } = await db
        .from("notification")
        .insert({
            studentid: studentId,
            // fullname: student.fullname,
            message: message,
            type: type
            // notidate sẽ tự CURRENT_DATE
        });

    if (error) {
        showPopup(
            "Lỗi",
            "Không thể gửi thông báo. Vui lòng thử lại."
        );
    }
}

// function normalizeString(str) {
//     return (str || "")
//         .toLowerCase()
//         .normalize("NFD")
//         .replace(/[\u0300-\u036f]/g, "") // bỏ dấu
//         .trim();
// }

function normalizeString(str) {
    return (str || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // bỏ dấu
        .replace(/đ/g, "d")              // xử lý đ
        .replace(/Đ/g, "d")              // xử lý Đ
        .trim();
}
