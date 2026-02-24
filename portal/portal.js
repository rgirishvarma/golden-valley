// Admin/User Portal UI (no login yet). Data is temporary in-memory.
// Later: Connect Supabase + OTP + RLS (users only see their plots/payments).

let users = [
  { id: "u1", name: "Admin", phone: "+91XXXXXXXXXX", role: "admin" },
  { id: "u2", name: "Ramesh", phone: "+91XXXXXXXXXX", role: "user" },
  { id: "u3", name: "Sita", phone: "+91XXXXXXXXXX", role: "user" },
];

let plots = [
  { id: "p1", plot: "A-101", status: "Available", ownerUserId: null, location: "Block A", notes: "Near entrance", totalPrice: 600000 },
  { id: "p2", plot: "A-102", status: "Assigned", ownerUserId: "u2", location: "Block A", notes: "Corner plot", totalPrice: 650000 },
  { id: "p3", plot: "B-201", status: "Assigned", ownerUserId: "u3", location: "Block B", notes: "East facing", totalPrice: 700000 },
];

// Payments: linked to user + plot
let payments = [
  { id: "pay1", userId: "u2", plotId: "p2", date: "2026-02-10", amount: 50000, mode: "UPI", note: "Advance" },
  { id: "pay2", userId: "u2", plotId: "p2", date: "2026-02-18", amount: 25000, mode: "Cash", note: "Second payment" },
  { id: "pay3", userId: "u3", plotId: "p3", date: "2026-02-20", amount: 100000, mode: "Bank Transfer", note: "Booking" },
];

// Elements (may not exist on all pages)
const elPlotsBody = document.querySelector("#plotsTable tbody");
const elUsersBody = document.querySelector("#usersTable tbody");
const elSearch = document.getElementById("plotSearch");

const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const modalCancel = document.getElementById("modalCancel");
const modalOk = document.getElementById("modalOk");

let modalOnSave = null;

// -------- core helpers --------
function ownerInfo(plotRow) {
  const u = users.find(x => x.id === plotRow.ownerUserId);
  return u ? u : null;
}

function badgeForStatus(status) {
  const s = String(status).toLowerCase();
  if (s === "assigned") return `<span class="badge yellow">Assigned</span>`;
  if (s === "sold") return `<span class="badge gray">Sold</span>`;
  return `<span class="badge green">Available</span>`;
}

function formatDate(d) {
  // accepts "YYYY-MM-DD" or Date
  if (!d) return "";
  if (typeof d === "string") return d;
  return new Date(d).toISOString().slice(0, 10);
}

// -------- render tables --------
function renderPlots() {
  if (!elPlotsBody) return;

  const q = (elSearch?.value || "").trim().toLowerCase();
  const filtered = plots.filter(p => p.plot.toLowerCase().includes(q));

  elPlotsBody.innerHTML = filtered.map(p => {
    const o = ownerInfo(p);
    return `
      <tr>
        <td><strong>${escapeHtml(p.plot)}</strong></td>
        <td>${badgeForStatus(p.status)}</td>
        <td>${o ? escapeHtml(o.name) : "-"}</td>
        <td>${o ? escapeHtml(o.phone) : "-"}</td>
        <td class="right">
          <button class="btn small ghost" data-act="editPlot" data-id="${p.id}">Edit</button>
          <button class="btn small ghost" data-act="assignPlot" data-id="${p.id}">Assign</button>
          <button class="btn small" data-act="deletePlot" data-id="${p.id}">Delete</button>
        </td>
      </tr>
    `;
  }).join("");
}

function renderUsers() {
  if (!elUsersBody) return;

  elUsersBody.innerHTML = users.map(u => {
    const assigned = plots
      .filter(p => p.ownerUserId === u.id)
      .map(p => p.plot)
      .join(", ");

    return `
      <tr>
        <td><strong>${escapeHtml(u.name)}</strong></td>
        <td>${escapeHtml(u.phone)}</td>
        <td>${escapeHtml(u.role)}</td>
        <td>${assigned || "-"}</td>
        <td class="right">
          <button class="btn small ghost" data-act="editUser" data-id="${u.id}">Edit</button>
          <button class="btn small" data-act="deleteUser" data-id="${u.id}">Delete</button>
        </td>
      </tr>
    `;
  }).join("");
}

// -------- modal --------
function openModal({ title, bodyHtml, onSave }) {
  if (!modal) return;
  modalTitle.textContent = title;
  modalBody.innerHTML = bodyHtml;
  modalOnSave = onSave;
  modal.classList.remove("hidden");
}

function closeModal() {
  if (!modal) return;
  modal.classList.add("hidden");
  modalBody.innerHTML = "";
  modalOnSave = null;
}

if (modalCancel) modalCancel.addEventListener("click", closeModal);

if (modalOk) modalOk.addEventListener("click", async () => {
  if (typeof modalOnSave === "function") await modalOnSave();
  closeModal();
  renderAll();
});

// -------- buttons on pages --------
const btnAddPlot = document.getElementById("btnAddPlot");
if (btnAddPlot) {
  btnAddPlot.addEventListener("click", () => {
    openModal({
      title: "Add Plot",
      bodyHtml: `
        <div class="field"><label>Plot Number</label><input id="mPlot" placeholder="A-101" /></div>
        <div class="field"><label>Status</label>
          <select id="mStatus">
            <option>Available</option>
            <option>Assigned</option>
            <option>Sold</option>
          </select>
        </div>
        <div class="field"><label>Total Price (₹)</label><input id="mTotal" type="number" min="0" placeholder="650000" /></div>
        <div class="field"><label>Location</label><input id="mLocation" placeholder="Block A" /></div>
        <div class="field"><label>Notes</label><input id="mNotes" placeholder="Near entrance" /></div>
        <div class="help">Owner assignment can be done using “Assign”.</div>
      `,
      onSave: () => {
        const plot = document.getElementById("mPlot").value.trim();
        const status = document.getElementById("mStatus").value;
        const totalPrice = Number(document.getElementById("mTotal").value || 0);
        const location = document.getElementById("mLocation").value.trim();
        const notes = document.getElementById("mNotes").value.trim();
        if (!plot) return alert("Enter plot number");
        if (!(totalPrice > 0)) return alert("Enter total price");

        plots.unshift({
          id: crypto.randomUUID(),
          plot,
          status,
          ownerUserId: null,
          totalPrice,
          location: location || "Golden Valley",
          notes: notes || "-"
        });
      }
    });
  });
}

const btnAddUser = document.getElementById("btnAddUser");
if (btnAddUser) {
  btnAddUser.addEventListener("click", () => {
    openModal({
      title: "Add User",
      bodyHtml: `
        <div class="field"><label>Name</label><input id="mName" placeholder="User name" /></div>
        <div class="field"><label>Phone</label><input id="mPhone" placeholder="+91XXXXXXXXXX" /></div>
        <div class="field"><label>Role</label>
          <select id="mRole">
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
        </div>
      `,
      onSave: () => {
        const name = document.getElementById("mName").value.trim();
        const phone = document.getElementById("mPhone").value.trim();
        const role = document.getElementById("mRole").value;
        if (!name || !phone) return alert("Enter name and phone");
        users.unshift({ id: crypto.randomUUID(), name, phone, role });
      }
    });
  });
}

const btnExport = document.getElementById("btnExport");
if (btnExport) {
  btnExport.addEventListener("click", () => {
    const rows = [["Plot","Status","Owner","Phone","TotalPrice","Location","Notes"]];
    plots.forEach(p => {
      const o = ownerInfo(p);
      rows.push([p.plot, p.status, o?.name || "", o?.phone || "", p.totalPrice || 0, p.location || "", p.notes || ""]);
    });
    downloadCsv("golden-valley-plots.csv", rows);
  });
}

if (elSearch) elSearch.addEventListener("input", renderPlots);

// -------- actions (edit/assign/delete) --------
document.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-act]");
  if (!btn) return;
  const act = btn.dataset.act;
  const id = btn.dataset.id;

  if (act === "deletePlot") {
    // also remove payments for that plot
    payments = payments.filter(pay => pay.plotId !== id);
    plots = plots.filter(p => p.id !== id);
    renderAll();
  }

  if (act === "editPlot") {
    const p = plots.find(x => x.id === id);
    if (!p) return;

    openModal({
      title: "Edit Plot",
      bodyHtml: `
        <div class="field"><label>Plot Number</label><input id="mPlot" value="${escapeAttr(p.plot)}" /></div>
        <div class="field"><label>Status</label>
          <select id="mStatus">
            <option ${p.status==="Available"?"selected":""}>Available</option>
            <option ${p.status==="Assigned"?"selected":""}>Assigned</option>
            <option ${p.status==="Sold"?"selected":""}>Sold</option>
          </select>
        </div>
        <div class="field"><label>Total Price (₹)</label><input id="mTotal" type="number" min="0" value="${escapeAttr(String(p.totalPrice || 0))}" /></div>
        <div class="field"><label>Location</label><input id="mLocation" value="${escapeAttr(p.location || "")}" /></div>
        <div class="field"><label>Notes</label><input id="mNotes" value="${escapeAttr(p.notes || "")}" /></div>
        <div class="help">Owner assignment is managed via “Assign”.</div>
      `,
      onSave: () => {
        p.plot = document.getElementById("mPlot").value.trim() || p.plot;
        p.status = document.getElementById("mStatus").value;
        p.totalPrice = Number(document.getElementById("mTotal").value || p.totalPrice || 0);
        p.location = document.getElementById("mLocation").value.trim() || p.location;
        p.notes = document.getElementById("mNotes").value.trim() || p.notes;
      }
    });
  }

  if (act === "assignPlot") {
    const p = plots.find(x => x.id === id);
    if (!p) return;

    const options = [`<option value="">(No owner)</option>`].concat(
      users
        .filter(u => u.role !== "admin")
        .map(u =>
          `<option value="${u.id}" ${p.ownerUserId===u.id?"selected":""}>${escapeHtml(u.name)} • ${escapeHtml(u.phone)}</option>`
        )
    ).join("");

    openModal({
      title: `Assign Plot • ${p.plot}`,
      bodyHtml: `
        <div class="field"><label>Assign to user</label>
          <select id="mOwner">${options}</select>
        </div>
        <div class="help">Later (OTP + RLS): user will only see their assigned plots/payments.</div>
      `,
      onSave: () => {
        const owner = document.getElementById("mOwner").value || null;
        p.ownerUserId = owner;
        p.status = owner ? "Assigned" : "Available";
      }
    });
  }

  if (act === "editUser") {
    const u = users.find(x => x.id === id);
    if (!u) return;

    openModal({
      title: "Edit User",
      bodyHtml: `
        <div class="field"><label>Name</label><input id="mName" value="${escapeAttr(u.name)}" /></div>
        <div class="field"><label>Phone</label><input id="mPhone" value="${escapeAttr(u.phone)}" /></div>
        <div class="field"><label>Role</label>
          <select id="mRole">
            <option value="user" ${u.role==="user"?"selected":""}>user</option>
            <option value="admin" ${u.role==="admin"?"selected":""}>admin</option>
          </select>
        </div>
      `,
      onSave: () => {
        u.name = document.getElementById("mName").value.trim() || u.name;
        u.phone = document.getElementById("mPhone").value.trim() || u.phone;
        u.role = document.getElementById("mRole").value;
      }
    });
  }

  if (act === "deleteUser") {
    // unassign plots + remove payments for that user
    plots.forEach(p => { if (p.ownerUserId === id) p.ownerUserId = null; });
    payments = payments.filter(pay => pay.userId !== id);
    users = users.filter(u => u.id !== id);
    renderAll();
  }
});

function renderAll() {
  renderPlots();
  renderUsers();
}

// -------- utilities --------
function downloadCsv(filename, rows) {
  const csv = rows.map(r => r.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

function csvCell(v) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replaceAll('"','""')}"`;
  return s;
}

function escapeHtml(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;");
}
function escapeAttr(s){
  return escapeHtml(s).replaceAll('"',"&quot;");
}

// Initial render (safe if tables don't exist on the page)
renderAll();
