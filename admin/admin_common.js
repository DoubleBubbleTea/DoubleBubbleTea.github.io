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
            fullname: student.fullname,
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

// ===============================
// ADMIN BOOKING CALENDAR COMMON
// ===============================

let weekDates = [];
let slotDefs = [];
let currentBookings = [];

/* ===============================
   WEEK + SLOT INIT
================================ */
function initWeekDates() {
    const today = new Date();
    const dow = today.getDay(); // 0 = CN

    // lùi về CN đầu tuần
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - dow);
    sunday.setHours(0, 0, 0, 0);

    weekDates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(sunday);
        d.setDate(sunday.getDate() + i);
        weekDates.push(d);
    }

    const select = document.getElementById("daySelect");
    if (!select) return;

    const names = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
    select.innerHTML = "";

    weekDates.forEach((d, i) => {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent =
            `${names[i]} - ${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
                .toString().padStart(2, "0")}`;
        select.appendChild(opt);
    });

    // mặc định chọn hôm nay
    select.value = String(dow);
}

function initSlots() {
    slotDefs = [];
    // 7:00 → 20:00, mỗi slot 1 giờ
    for (let m = 7 * 60; m < 20 * 60; m += 60) {
        slotDefs.push({
            startMinutes: m,
            endMinutes: m + 60,
            label: `${formatTime(m)} - ${formatTime(m + 60)}`
        });
    }
}

function formatTime(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/* ===============================
   SLOT STATUS (ADMIN VIEW)
   - past   : đã qua
   - using  : đang sử dụng
   - hold   : đang giữ chỗ
   - booked : đã đặt
   - free   : trống
================================ */
function getSlotStatus(slotStart, slotEnd) {
    for (const b of currentBookings) {
        // không giao
        if (slotStart >= b.end || slotEnd <= b.start) continue;

        if (b.status === "Đang sử dụng") {
            return "using";
        }

        if (b.status === "Đang giữ chỗ") {
            return "hold";
        }

        return "booked";
    }

    const now = new Date();
    if (slotEnd <= now) {
        return "past";
    }

    return "free";
}

/* ===============================
   RENDER CALENDAR
================================ */
function renderCalendar() {
    const table = document.getElementById("calendarTable");
    if (!table) return;

    table.innerHTML = "";

    /* ===== HEADER ===== */
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    headerRow.innerHTML = `<th>Giờ</th>`;

    const shortNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    for (let i = 0; i < 7; i++) {
        const d = weekDates[i];
        const th = document.createElement("th");
        th.innerHTML =
            `${shortNames[i]}<br>${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
                .toString().padStart(2, "0")}`;
        headerRow.appendChild(th);
    }

    thead.appendChild(headerRow);
    table.appendChild(thead);

    /* ===== BODY ===== */
    const tbody = document.createElement("tbody");

    slotDefs.forEach(slot => {
        const tr = document.createElement("tr");

        // cột giờ
        const tdTime = document.createElement("td");
        tdTime.innerText = slot.label;
        tr.appendChild(tdTime);

        // 7 ngày
        for (let i = 0; i < 7; i++) {
            const td = document.createElement("td");
            const div = document.createElement("div");
            div.className = "slot";

            const start = new Date(weekDates[i]);
            start.setHours(0, 0, 0, 0);
            start.setMinutes(slot.startMinutes);

            const end = new Date(start);
            end.setMinutes(start.getMinutes() + 60);

            const status = getSlotStatus(start, end);

            if (status === "past") div.classList.add("past");
            if (status === "using") div.classList.add("booked", "using");
            if (status === "hold") div.classList.add("booked", "hold");
            if (status === "booked") div.classList.add("booked");

            td.appendChild(div);
            tr.appendChild(td);
        }

        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
}

/* ===============================
   LOAD BOOKINGS BY ROOM (ADMIN)
================================ */
async function loadBookingsForRoom(roomId) {
    if (!roomId) return;

    const { data, error } = await db
        .from("booking")
        .select("starttime, endtime, booking_status")
        .eq("roomid", roomId)
        .neq("booking_status", "Hủy");

    if (error) {
        console.error("Load bookings error:", error.message);
        currentBookings = [];
        return;
    }

    currentBookings = (data || []).map(b => ({
        start: new Date(b.starttime),
        end: new Date(b.endtime),
        status: b.booking_status
    }));
}
