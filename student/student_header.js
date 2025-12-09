// ===============================
// JS LOAD TÊN SINH VIÊN CHUNG
// ===============================

// Tạo client Supabase
const db = supabase.createClient(
    "https://oxaimnemcnqudtdguoyk.supabase.co",
    "sb_publishable_6p-lVAZg_ATPz1a1cDjlOg_9vIcR42c"
);

// Hàm load tên sinh viên
async function loadStudentName() {
    const studentId = localStorage.getItem("studentid");
    console.log("studentId:", studentId);

    const headerUser = document.getElementById("header-user");
    if (!headerUser) return; // tránh lỗi nếu file ko có header-user

    if (!studentId) {
        headerUser.innerText = "Chưa đăng nhập";
        return;
    }

    const { data, error } = await db
        .from("student")
        .select("fullname")
        .eq("studentid", studentId)
        .single();

    if (error || !data) {
        console.log(error);
        headerUser.innerText = "Không tìm thấy sinh viên";
        return;
    }

    headerUser.innerText = `Xin chào, ${data.fullname}`;
}

loadStudentName();
/* ===== DROPDOWN NOTIFICATION ===== */
function toggleNotification() {
    const box = document.getElementById("notif-dropdown");
    box.style.display = box.style.display === "block" ? "none" : "block";
}

async function loadNotifications() {
    const adminId = localStorage.getItem("adminid");
    if (!adminId) return;

    const { data } = await db
        .from("notification")
        .select("*")
        .eq("adminid", adminId)
        .order("notification_id", { ascending: false });

    const list = document.getElementById("notif-list");
    const count = document.getElementById("notif-count");

    if (!data || data.length === 0) {
        list.innerHTML = "<div class='notif-item'>Không có thông báo</div>";
        count.style.display = "none";
        return;
    }

    count.style.display = "block";
    count.innerText = data.length;

    list.innerHTML = data
        .map(n => `<div class="notif-item">${n.message}</div>`)
        .join("");
}


/* ===== LOGOUT ===== */
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

loadNotifications();