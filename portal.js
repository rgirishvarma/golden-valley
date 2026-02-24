// Admin Portal UI (no login yet). Data is temporary in-memory.
// Later we will connect this to Supabase + OTP + RLS.

let users = [
  { id: "u1", name: "Admin", phone: "+91XXXXXXXXXX", role: "admin" },
  { id: "u2", name: "Ramesh", phone: "+91XXXXXXXXXX", role: "user" },
  { id: "u3", name: "Sita", phone: "+91XXXXXXXXXX", role: "user" },
];

let plots = [
  { id: "p1", plot: "A-101", status: "Available", ownerUserId: null },
  { id: "p2", plot: "A-102", status: "Assigned", ownerUserId: "u2" },
  { id: "p3", plot: "B-201", status: "Assigned", ownerUserId: "u3" },
];

const elPlotsBody = document.querySelector("#plotsTable tbody");
const elUsersBody = document.querySelector("#usersTable tbody");
const elSearch = document.getElementById("plotSearch");

const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const modalCancel = document.getElementById("modalCancel");
const modalOk = document.getElementById("modalOk");

let modalOnSave = null;

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

function renderPlots() {
  const q = (elSearch.value || "").trim().toLowerCase();
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
  elUsersBody.innerHTML = users.map(u => {
    const assigned = plots.filter(p => p.ownerUserId === u.id).map(p => p.plot).join(", ");
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

function openModal({ title, bodyHtml, onSave }) {
  modalTitle.textContent = title;
  modalBody.innerHTML = bodyHtml;
  modalOnSave = onSave;
  modal.classList.remove("hidden");
}

function closeModal() {
  modal.classList.add("hidden");
  modalBody.innerHTML = "";
  modalOnSave = null;
}

modalCancel.addEventListener("click", closeModal);
modalOk.addEventListener("click", async () => {
  if (typeof modalOnSave === "function") await modalOnSave();
  closeModal();
  renderAll();
});

document.getElementById("btnAddPlot").addEventListener("click", () => {
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
      <div class="help">Owner assignment can be done using “Assign”.</div>
    `,
    onSave: () => {
      const plot = document.getElementById("mPlot").value.trim();
      const status = document.getElementById("mStatus").value;
      if (!plot) return alert("Enter plot number");
      plots.unshift({ id: crypto.randomUUID(), plot, status, ownerUserId: null });
    }
  });
});

document.getElementById("btnAddUser").addEventListener("click", () => {
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

document.getElementById("btnExport").addEventListener("click", () => {
  const rows = [["Plot","Status","Owner","Phone"]];
  plots.forEach(p => {
    const o = ownerInfo(p);
    rows.push([p.plot, p.status, o?.name || "", o?.phone || ""]);
  });
  downloadCsv("golden-valley-plots.csv", rows);
});

elSearch.addEventListener("input", renderPlots);

document.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-act]");
  if (!btn) return;
  const act = btn.dataset.act;
  const id = btn.dataset.id;

  if (act === "deletePlot") {
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
        <div class="help">Owner assignment is managed via “Assign”.</div>
      `,
      onSave: () => {
        p.plot = document.getElementById("mPlot").value.trim() || p.plot;
        p.status = document.getElementById("mStatus").value;
      }
    });
  }

  if (act === "assignPlot") {
    const p = plots.find(x => x.id === id);
    if (!p) return;
    const options = [`<option value="">(No owner)</option>`].concat(
      users.filter(u => u.role !== "admin").map(u =>
        `<option value="${u.id}" ${p.ownerUserId===u.id?"selected":""}>${escapeHtml(u.name)} • ${escapeHtml(u.phone)}</option>`
      )
    ).join("");

    openModal({
      title: `Assign Plot • ${p.plot}`,
      bodyHtml: `
        <div class="field"><label>Assign to user</label>
          <select id="mOwner">${options}</select>
        </div>
        <div class="help">After login setup, users will only see plots assigned to them.</div>
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
    // also unassign plots
    plots.forEach(p => { if (p.ownerUserId === id) p.ownerUserId = null; });
    users = users.filter(u => u.id !== id);
    renderAll();
  }
});

function renderAll() {
  renderPlots();
  renderUsers();
}

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
function escapeHtml(s){ return String(s??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;"); }
function escapeAttr(s){ return escapeHtml(s).replaceAll('"',"&quot;"); }

renderAll();