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
    const { data, error } = await db
        .from("notification")
        .select("*")
        .order("notification_id", { ascending: false });

    const list = document.getElementById("notif-list");
    const count = document.getElementById("notif-count");

    if (error) {
        list.innerHTML = "<div class='notif-item'>Lỗi tải thông báo</div>";
        count.style.display = "none";
        return;
    }

    if (!data || data.length === 0) {
        list.innerHTML = "<div class='notif-item'>Không có thông báo</div>";
        count.style.display = "none";
        return;
    }

    // Hiển thị số lượng thông báo
    count.style.display = "block";
    count.innerText = data.length;

    // Danh sách thông báo
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

function showPopup(title, message) {
    document.getElementById("modal-title").innerText = title;
    document.getElementById("modal-message").innerText = message;
    document.getElementById("popupModal").style.display = "flex";
}

function closeModal() {
    document.getElementById("popupModal").style.display = "none";
}

async function checkTrustBeforeBooking() {
    const studentId = localStorage.getItem("studentid");

    if (!studentId) {
        showPopup("Lỗi", "Không tìm thấy tài khoản!");
        return;
    }

    // Lấy trust_score từ database
    const { data, error } = await db
        .from("student")
        .select("trust_score")
        .eq("studentid", studentId)
        .single();

    if (error || !data) {
        showPopup("Lỗi", "Không thể kiểm tra điểm uy tín!");
        return;
    }

    const trust = data.trust_score ?? 0;

    // Kiểm tra điều kiện
    if (trust < 60) {
        showPopup(
            "Tài khoản bị hạn chế",
            "Tài khoản bị khóa vì không đạt điểm uy tín, bạn không thể đặt phòng!"
        );
        return;
    }

    // Nếu đủ điểm uy tín → chuyển trang
    window.location.href = "./pre_booking.html";
}
