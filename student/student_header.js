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

/* ===================================================================
    WEEK + SLOTS
=================================================================== */
function initWeekDates() {
    const today = new Date();
    const dow = today.getDay();          // 0 = CN, 1 = T2, ...
    const diff = (dow === 0 ? -6 : 1 - dow); // lùi về thứ 2

    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);

    weekDates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        weekDates.push(d);
    }

    const select = document.getElementById("daySelect");
    select.innerHTML = "";

    const names = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];

    weekDates.forEach((d, i) => {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = `${names[i]} - ${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
        select.appendChild(opt);
    });

    // chọn đúng hôm nay
    const idx = Math.min(Math.max(dow - 1, 0), 6);
    select.value = String(idx);
}

function initSlots() {
    slotDefs = [];
    for (let m = 7 * 60; m < 20 * 60; m += 30) { // 7h -> 20h, mỗi 30'
        slotDefs.push({
            startMinutes: m,
            endMinutes: m + 30,
            label: `${formatTime(m)} - ${formatTime(m + 30)}`
        });
    }
}

function formatTime(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/* ===================================================================
    SLOT STATUS (ĐỂ TÔ MÀU)
    - past: slot đã qua (end <= now) -> xám, không cho chọn
    - using: trong khoảng booking Đang sử dụng, now giữa start-end -> vàng
    - hold: trong khoảng booking Đang giữ chỗ (tương lai) -> đỏ
    - booked: có booking nhưng ko match 2 case trên -> xám
    - free: chưa book, còn tương lai -> trắng, được chọn
=================================================================== */
function getSlotStatus(slotStart, slotEnd) {
    const now = new Date();

    if (slotEnd <= now) {
        return "past";
    }

    for (const b of currentBookings) {
        if (slotStart < b.end && slotEnd > b.start) {
            if (b.status === "Đang sử dụng" && now >= b.start && now < b.end) {
                return "using";
            }
            if (b.status === "Đang giữ chỗ" && now < b.start) {
                return "hold";
            }
            return "booked";
        }
    }
    return "free";
}

/* ===================================================================
    LOAD FACILITIES FROM DATABASE
=================================================================== */
async function loadFacilities() {
    const container = document.getElementById("facilityContainer");
    container.innerHTML = "<p>Đang tải...</p>";

    const { data, error } = await db
        .from("facilities")
        .select("*")
        .order("facility_id");

    if (error) {
        container.innerHTML = "<p>Lỗi tải tiện ích!</p>";
        return;
    }

    facilityData = data || [];
    container.innerHTML = "";

    facilityData.forEach(f => {
        const label = document.createElement("label");
        label.innerHTML = `
                    <input type="checkbox" class="facility"
                           value="${f.facility_type}"
                           data-cost="${f.cost}">
                    ${f.facility_type} (+${f.cost.toLocaleString()}đ/giờ)
                `;
        container.appendChild(label);
    });
}

/* ===================================================================
RENDER CALENDAR
=================================================================== */
function renderCalendar() {
    const table = document.getElementById("calendarTable");
    table.innerHTML = "";

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    headerRow.innerHTML = `<th>Tiết</th>`;

    const shortNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
    weekDates.forEach((d, i) => {
        const th = document.createElement("th");
        th.innerHTML = `${shortNames[i]}<br>${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    slotDefs.forEach(slot => {
        const tr = document.createElement("tr");

        const tdTime = document.createElement("td");
        tdTime.classList.add("time-col");
        tdTime.innerText = slot.label;
        tr.appendChild(tdTime);

        for (let col = 0; col < 7; col++) {
            const td = document.createElement("td");
            const div = document.createElement("div");
            div.className = "slot";

            const start = new Date(weekDates[col]);
            start.setHours(0, 0, 0, 0);
            start.setMinutes(slot.startMinutes);

            const end = new Date(start);
            end.setMinutes(start.getMinutes() + 30);

            // lưu theo local (VN), không có Z
            div.dataset.start = toLocalTimestampString(start);
            div.dataset.end = toLocalTimestampString(end);

            const status = getSlotStatus(start, end);
            if (status === "past") {
                div.classList.add("past");
            } else if (status === "using") {
                div.classList.add("booked", "using");
            } else if (status === "hold") {
                div.classList.add("booked", "hold");
            } else if (status === "booked") {
                div.classList.add("booked");
            }
            // free -> giữ nguyên .slot

            td.appendChild(div);
            tr.appendChild(td);
        }

        tbody.appendChild(tr);
    });

    table.appendChild(tbody);

    enableSlotSelection();
}

