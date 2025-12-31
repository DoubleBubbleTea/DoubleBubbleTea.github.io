// ===============================
// JS LOAD TÊN SINH VIÊN CHUNG
// ===============================

// Tạo client Supabase
const db = supabase.createClient(
    "https://oxaimnemcnqudtdguoyk.supabase.co",
    "sb_publishable_6p-lVAZg_ATPz1a1cDjlOg_9vIcR42c"
);
function toLocalTimestampString(date) {
    const pad = (n) => n.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
        `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

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
function getNotifIcon(type) {
    switch (type) {
        case "Xác nhận":
            return { cls: "confirm", icon: "fa-check" };
        case "Cảnh báo":
            return { cls: "warning", icon: "fa-exclamation" };
        case "Nhắc nhở":
            return { cls: "remind", icon: "fa-bullhorn" };
        default: // "Thông tin"
            return { cls: "info", icon: "fa-bullhorn" };
    }
}

async function loadNotifications() {
    const studentid = localStorage.getItem("studentid");
    if (!studentid) return;

    const { data, error } = await db
        .from("notification")
        .select("notification_id, message, type, notidate")
        .eq("studentid", studentid)
        .order("notification_id", { ascending: false });

    const list = document.getElementById("notif-list");
    const count = document.getElementById("notif-count");

    if (error) {
        console.error(error);
        list.innerHTML = `
            <div class="notif-item">
                <div class="notif-mini-icon warning">!</div>
                <div class="notif-content">
                    <div class="notif-item-title">Lỗi tải thông báo</div>
                </div>
            </div>`;
        count.style.display = "none";
        return;
    }

    if (!data || data.length === 0) {
        list.innerHTML = `
            <div class="notif-item">
                <div class="notif-mini-icon info">i</div>
                <div class="notif-content">
                    <div class="notif-item-title">Không có thông báo</div>
                </div>
            </div>`;
        count.style.display = "none";
        return;
    }

    // ✅ Hiển thị số lượng
    count.style.display = "block";
    count.innerText = data.length;

    // 🎯 MAP TYPE → ICON + CLASS
    const TYPE_MAP = {
        "Xác nhận": { cls: "confirm", icon: "fa-check" },
        "Cảnh báo": { cls: "warning", icon: "fa-exclamation" },
        "Nhắc nhở": { cls: "remind", icon: "fa-bullhorn" },
        "Thông tin": { cls: "info", icon: "fa-bullhorn" }
    };

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
    document.getElementById("modal-message").innerHTML = message;
    document.getElementById("popupModal").style.display = "flex";
}

function closeModal() {
    document.getElementById("popupModal").style.display = "none";
        // 👉 mở feedback cho checkout ghế
    if (pendingSeatCheckoutBooking) {
        document.getElementById("feedback-seat-modal").style.display = "flex";
    }
}

async function checkTrustBeforeBooking() {
    const studentId = localStorage.getItem("studentid");

    if (!studentId) {
        showPopup("Lỗi", "Không tìm thấy tài khoản!");
        return;
    }

    // 🔍 Lấy status của sinh viên
    const { data, error } = await db
        .from("student")
        .select("status")
        .eq("studentid", studentId)
        .single();

    if (error || !data) {
        showPopup("Lỗi", "Không thể kiểm tra trạng thái tài khoản!");
        return;
    }

    // 🚫 Nếu bị vô hiệu hóa → chặn đặt phòng
    if (data.status === "Vô hiệu hóa") {
        showPopup(
            "Tài khoản bị vô hiệu hóa",
            "Bạn đã bị khóa quyền đặt phòng do vi phạm quy định check-in."
        );
        return;
    }

    // ✅ Hợp lệ → cho phép đặt phòng
    window.location.href = "./pre_booking.html";
}

/* ===================================================================
    WEEK + SLOTS
=================================================================== */
function initWeekDates() {
    const today = new Date();
    const dow = today.getDay(); // 0 = CN, 1 = T2, ..., 6 = T7

    // ⬅️ lùi về Chủ nhật đầu tuần
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

    select.innerHTML = "";

    const names = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

    weekDates.forEach((d, i) => {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent =
            `${names[i]} - ${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
        select.appendChild(opt);
    });

    // chọn đúng ngày hôm nay
    select.value = String(dow);
}


function initSlots() {
    slotDefs = [];
    for (let m = 7 * 60; m < 20 * 60; m += 60) { // 7h -> 20h, mỗi 30'
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

/* ===================================================================
    SLOT STATUS (ĐỂ TÔ MÀU)
    - past: slot đã qua (end <= now) -> xám, không cho chọn
    - using: trong khoảng booking Đang sử dụng, now giữa start-end -> vàng
    - hold: trong khoảng booking Đang giữ chỗ (tương lai) -> đỏ
    - booked: có booking nhưng ko match 2 case trên -> xám
    - free: chưa book, còn tương lai -> trắng, được chọn
=================================================================== */
// function getSlotStatus(slotStart, slotEnd) {
//     const now = new Date();
//     console.log("getSlotStatus slotStart: ", slotStart);
//     console.log("getSlotStatus now: ", now);
//     console.log("getSlotStatus slotEnd: ", slotEnd);

//     if (slotEnd <= now) {
//         return "past";
//     }

//     for (const b of currentBookings) {
//         console.log("getSlotStatus b.start: ", b.start);
//         console.log("getSlotStatus b.end: ", b.end);
//         if (slotStart < b.end && slotEnd > b.start) {
//             if (b.status === "Đang sử dụng" && now >= b.start && now < b.end) {
//                 console.log("using");
//                 return "using";
//             }
//             if (b.status === "Đang giữ chỗ" && now < b.start) {
//                 console.log("hold");
//                 return "hold";
//             }
//             console.log("booked");
//             return "booked";
//         }
//     }
//     return "free";
// }

function getSlotStatus(slotStart, slotEnd) {
    const GRACE_MINUTES = 30;

    // 1️⃣ ƯU TIÊN BOOKING
    for (const b of currentBookings) {

        // không giao booking
        if (slotStart >= b.end || slotEnd <= b.start) continue;

        // ===== ĐANG SỬ DỤNG =====
        if (b.status === "Đang sử dụng") {
            return "using";   // tất cả slot trong booking cùng màu
        }

        // ===== ĐÃ CHECKOUT =====
        if (b.status === "Đã sử dụng" && b.checkout) {

            const usedMinutes =
                (b.checkout.getTime() - b.start.getTime()) / 60000;

            // checkout sớm (≤ 30p) → trả toàn bộ
            if (usedMinutes <= GRACE_MINUTES) {
                return "free";
            }

            // checkout muộn → slot đã bị chiếm
            if (slotStart < b.checkout) {
                return "booked";
            }

            return "free";
        }

        // ===== GIỮ CHỖ =====
        if (b.status === "Đang giữ chỗ") {
            return "hold";
        }
    }

    // 2️⃣ KHÔNG THUỘC BOOKING → MỚI XÉT PAST
    const now = new Date();
    if (slotEnd <= now) {
        return "past";
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
    const columnOrder = [0, 1, 2, 3, 4, 5, 6];
    const shortNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    columnOrder.forEach(i => {
        const d = weekDates[i];
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

        for (let idx = 0; idx < 7; idx++) {
            const col = columnOrder[idx];

            const td = document.createElement("td");
            const div = document.createElement("div");
            div.className = "slot";

            const start = new Date(weekDates[col]);
            start.setHours(0, 0, 0, 0);
            start.setMinutes(slot.startMinutes);

            const end = new Date(start);
            end.setMinutes(start.getMinutes() + 60);

            // KHÔNG CHO ĐẶT T7 & CN
            // const dayOfWeek = start.getDay(); // 0 = CN, 6 = T7
            // if (dayOfWeek === 0 || dayOfWeek === 6) {
            //     div.classList.add("past");        // xám
            //     div.title = "Không cho phép đặt phòng vào Thứ 7 & Chủ nhật";
            //     td.appendChild(div);
            //     tr.appendChild(td);
            //     continue; // bỏ qua xử lý booking khác
            // }

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
            // console.log("status: ", status);

            td.appendChild(div);
            tr.appendChild(td);
        }

        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    enableSlotSelection();
}

async function checkUpcomingBooking() {
    const studentid = localStorage.getItem("studentid");
    if (!studentid) return;

    const now = new Date();
    const in15Min = new Date(now.getTime() + 30 * 60000);

    const nowStr = toLocalTimestampString(now);
    const in15MinStr = toLocalTimestampString(in15Min);

    const { data, error } = await db
        .from("booking")
        .select("roomid, starttime")
        .eq("studentid", studentid)
        .in("booking_status", ["Đang giữ chỗ"])
        .like("roomid", "G%")              // ✅ chỉ lấy roomid bắt đầu bằng G
        .gte("starttime", nowStr)
        .lte("starttime", in15MinStr)
        .order("starttime", { ascending: true })
        .limit(1);

    if (error || !data || data.length === 0) {
        document.getElementById("bookingReminder").style.display = "none";
        return;
    }

    const booking = data[0];
    const start = new Date(booking.starttime);

    const timeStr = start.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit"
    });

    document.getElementById("reminderText").innerHTML = `
        Phòng <strong>${booking.roomid}</strong> sẽ bắt đầu lúc
        <strong>${timeStr}</strong>.
        Vui lòng check-in đúng giờ.
    `;

    document.getElementById("bookingReminder").style.display = "flex";
}


/* Kiểm tra khi load trang */
window.addEventListener("load", () => {
    checkUpcomingBooking();

    // Tự động refresh mỗi 1 phút
    setInterval(checkUpcomingBooking, 60 * 1000);
});

async function insertNotification(studentId, message, type = "Thông tin") {
    if (!studentId || !message) {
        showPopup(
            "Lỗi",
            "Thiếu thông tin sinh viên hoặc nội dung thông báo."
        );
        return;
    }

    // ✅ validate type theo 4 loại
    const VALID_TYPES = ["Xác nhận", "Cảnh báo", "Nhắc nhở", "Thông tin"];
    if (!VALID_TYPES.includes(type)) {
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
            // notidate để DEFAULT / CURRENT_DATE
        });

    if (error) {
        showPopup(
            "Lỗi",
            "Không thể gửi thông báo. Vui lòng thử lại."
        );
    }
}

function formatTimeRange(start, end) {
    const s = new Date(start).toLocaleString("vi-VN");
    const e = new Date(end).toLocaleString("vi-VN");
    return `${s} - ${e}`;
}

/**
 * ❌ Không cho SV đặt 2 chỗ/phòng cùng 1 khung giờ
 * @param {number} studentid
 * @param {Array<{start: Date, end: Date}>} intervals
 * @returns {boolean} true = bị trùng | false = hợp lệ
 */
async function checkDuplicateBookingTime(studentid, intervals) {
    if (!studentid || !intervals || intervals.length === 0) return false;

    // 🔹 Lấy tất cả booking của SV (chưa bị hủy)
    const { data, error } = await db
        .from("booking")
        .select("starttime, endtime")
        .eq("studentid", studentid)
        .neq("booking_status", "Hủy");

    if (error) {
        console.error("Check duplicate booking error:", error.message);
        return false; // fail-safe
    }

    // 🔹 Check overlap
    const isOverlapping = data.some(b => {
        const oldStart = new Date(b.starttime);
        const oldEnd = new Date(b.endtime);

        return intervals.some(itv => {
            const newStart = itv.start;
            const newEnd = itv.end;

            return newStart < oldEnd && newEnd > oldStart;
        });
    });

    if (isOverlapping) {
        showPopup(
            "Không thể đặt",
            "Khung giờ bạn chọn bị trùng với một đặt chỗ trước đó. Bạn không thể đặt 2 phòng/chỗ cùng thời gian."
        );
        return true;
    }

    return false;
}

function getRemainingMinutes(originalEnd, bookingStatus) {
    if (bookingStatus === "Hủy") {
        const now = new Date();
        return Math.floor((originalEnd - now) / 60000);
    }
    return Math.floor((originalEnd - new Date()) / 60000);
}

async function checkUpcomingSeatBookingReminder() {
    const now = new Date();
    const in15Min = new Date(now.getTime() + 15 * 60 * 1000);

    const nowStr = toLocalTimestampString(now);
    const in15Str = toLocalTimestampString(in15Min);

    // 1️⃣ Lấy booking sắp tới (≤ 15 phút)
    const { data: upcomingBookings, error } = await db
        .from("booking")
        .select("bookingid, studentid, seatid, roomid, starttime, reminder")
        .eq("booking_status", "Đang giữ chỗ")
        .eq("reminder", false)
        .gt("starttime", nowStr)
        .lte("starttime", in15Str);

    if (error || !upcomingBookings || upcomingBookings.length === 0) {
        return;
    }

    for (const b of upcomingBookings) {
        // 2️⃣ Kiểm tra ghế có đang bị sử dụng không
        const { data: usingSeat } = await db
            .from("booking")
            .select("bookingid")
            .eq("seatid", b.seatid)
            .eq("booking_status", "Đang sử dụng")
            .lt("starttime", nowStr)
            .gt("endtime", nowStr)
            .limit(1);

        // Nếu ghế đang bận → bỏ qua
        if (usingSeat && usingSeat.length > 0) continue;

        // 3️⃣ Gửi notification
        const startTimeText = new Date(b.starttime).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit"
        });

        await insertNotification(
            b.studentid,
            `Bạn có lịch sử dụng chỗ ngồi ${b.seatid} phòng ${b.roomid} lúc ${startTimeText}. 
       Hiện tại chỗ đang trống, bạn có thể đến sớm để chuẩn bị.`,
            "Thông tin"
        );

        // 4️⃣ Đánh dấu đã gửi để tránh spam
        await db
            .from("booking")
            .update({ reminder: true })
            .eq("bookingid", b.bookingid);
    }
}

function isAllowedBookingDate(bookingDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(bookingDate);
  target.setHours(0, 0, 0, 0);

  const diffDays =
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

  // chỉ cho hôm nay (0) hoặc ngày mai (1)
  return diffDays >= 0 && diffDays <= 1;
}
