import { useEffect, useState } from "react";
import { api } from "../../api";
import {
  Users,
  UserPlus,
  Search,
  ShieldCheck,
  UserCog,
  UserX,
  X,
  Mail,
  Phone,
  CalendarDays,
  BriefcaseBusiness,
  CheckCircle2,
  CircleAlert,
  Sparkles,
} from "lucide-react";

function Employee() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inviteLink, setInviteLink] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const emptyForm = {
    name: "",
    phone: "",
    email: "",
    role: "Employee",
    status: "Active",
  };

  const [form, setForm] = useState(emptyForm);

  // ========================================
  // STAFF API
  // ========================================

  const mapStaffMember = (staff) => ({
    id: staff.id,
    name: staff.name || staff.email || "Staff Member",
    phone: staff.phone || "-",
    email: staff.email || "-",
    role: staff.role || "Employee",
    status: staff.isActive === false ? "Inactive" : "Active",
    joined: staff.createdAt
      ? new Date(staff.createdAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "-",
  });

  const loadEmployees = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await api("/api/staff");
      const staffList = Array.isArray(data)
        ? data
        : data.staff || data.users || [];

      setEmployees(staffList.map(mapStaffMember));
    } catch (err) {
      console.error("Failed to load staff:", err);
      setError(err.message || "Failed to load employees.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  // ========================================
  // FILTER
  // ========================================

  const filteredEmployees = employees.filter((employee) => {
    const search = searchTerm.trim().toLowerCase();

    const matchesSearch =
      search === "" ||
      employee.name.toLowerCase().includes(search) ||
      employee.phone.includes(search) ||
      employee.email.toLowerCase().includes(search);

    const matchesRole =
      roleFilter === "All" || employee.role === roleFilter;

    const matchesStatus =
      statusFilter === "All" || employee.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // ========================================
  // STATISTICS
  // ========================================

  const totalEmployees = employees.length;

  const activeEmployees = employees.filter(
    (employee) => employee.status === "Active"
  ).length;

  const managerCount = employees.filter(
    (employee) => employee.role === "Manager"
  ).length;

  const inactiveEmployees = employees.filter(
    (employee) => employee.status === "Inactive"
  ).length;

  // ========================================
  // FORM
  // ========================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
  };

  // ========================================
  // ADD
  // ========================================

  const handleAddEmployee = async (event) => {
    event.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim();

    if (!name) {
      alert("Please enter employee name.");
      return;
    }

    if (!email || !email.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }

    setError("");

    try {
      const data = await api("/api/invite-staff", {
        method: "POST",
        body: {
          name,
          email,
          role: form.role,
        },
      });

      const returnedInviteLink =
        data.inviteLink || data.link || data.invite?.inviteLink || "";

      setInviteLink(returnedInviteLink);
      resetForm();
      setShowAddModal(false);
      await loadEmployees();

      if (!returnedInviteLink) {
        setError("Employee invited successfully, but no invite link was returned.");
      }
    } catch (err) {
      console.error("Failed to invite employee:", err);
      setError(err.message || "Failed to invite employee.");
    }
  };

  // ========================================
  // MODAL CLOSE
  // ========================================

  const closeAddModal = () => {
    resetForm();
    setShowAddModal(false);
  };

  const closeEditModal = () => {
    resetForm();
    setSelectedEmployee(null);
    setShowEditModal(false);
  };

  const closeDeleteModal = () => {
    setSelectedEmployee(null);
    setShowDeleteModal(false);
  };

  // ========================================
  // STYLES
  // ========================================

  const getRoleStyle = (role) => {
    if (role === "Admin") {
      return "bg-violet-500/15 text-violet-300 border-violet-400/20";
    }

    if (role === "Manager") {
      return "bg-blue-500/15 text-blue-300 border-blue-400/20";
    }

    return "bg-white/10 text-white/70 border-white/10";
  };

  const getStatusStyle = (status) => {
    if (status === "Active") {
      return "bg-emerald-500/15 text-emerald-300 border-emerald-400/20";
    }

    return "bg-red-500/15 text-red-300 border-red-400/20";
  };

  return (
    <div className="retailiq-app min-h-screen p-4 sm:p-6 lg:p-8 text-white">

      {/* ========================================
          HERO HEADER
      ======================================== */}

      <div className="relative overflow-hidden rounded-3xl mb-7 border border-white/10 bg-slate-950/55 backdrop-blur-2xl shadow-2xl shadow-black/20">

        {/* Glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-10 w-64 h-64 rounded-full bg-violet-500/15 blur-3xl pointer-events-none" />

        <div className="relative p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

          <div>
            <div className="flex flex-wrap items-center gap-3 mb-3">

              <div className="w-11 h-11 rounded-2xl bg-blue-500/15 border border-blue-400/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-300" />
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs font-semibold text-white/70">
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                TEAM MANAGEMENT
              </span>

            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Employees
            </h1>

            <p className="text-white/55 mt-2 max-w-xl text-sm sm:text-base">
              Manage your store team, roles, access and employee status
              from one place.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="
              group
              w-full lg:w-auto
              inline-flex items-center justify-center gap-2
              px-5 py-3.5
              rounded-2xl
              bg-gradient-to-r from-blue-500 to-indigo-500
              text-white font-semibold
              shadow-lg shadow-blue-500/20
              border border-blue-300/20
              hover:from-blue-400 hover:to-indigo-400
              hover:-translate-y-1
              hover:shadow-xl hover:shadow-blue-500/30
              active:scale-95
              transition-all duration-300
            "
          >
            <UserPlus className="w-5 h-5 transition-transform duration-300 group-hover:rotate-6" />
            Add Employee
          </button>

        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {inviteLink && (
        <div className="mb-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
          <p className="text-sm font-semibold text-emerald-200">
            Employee invitation created successfully.
          </p>
          <p className="mt-1 text-xs text-white/50">
            Share this link with the invited employee so they can set their password.
          </p>
          <a
            href={inviteLink}
            target="_blank"
            rel="noreferrer"
            className="mt-3 block break-all rounded-xl bg-black/20 px-3 py-2 text-sm text-cyan-300 underline underline-offset-2"
          >
            {inviteLink}
          </a>
        </div>
      )}

      {/* ========================================
          STATS
      ======================================== */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-6">

        <StatCard
          title="Total Employees"
          value={totalEmployees}
          subtitle="Registered staff"
          icon={<Users className="w-5 h-5" />}
          iconStyle="bg-blue-500/15 text-blue-300 border-blue-400/20"
        />

        <StatCard
          title="Active Employees"
          value={activeEmployees}
          subtitle="Currently active"
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconStyle="bg-emerald-500/15 text-emerald-300 border-emerald-400/20"
        />

        <StatCard
          title="Managers"
          value={managerCount}
          subtitle="Store managers"
          icon={<UserCog className="w-5 h-5" />}
          iconStyle="bg-violet-500/15 text-violet-300 border-violet-400/20"
        />

        <StatCard
          title="Inactive"
          value={inactiveEmployees}
          subtitle="Inactive accounts"
          icon={<UserX className="w-5 h-5" />}
          iconStyle="bg-red-500/15 text-red-300 border-red-400/20"
        />

      </div>

      {/* ========================================
          SEARCH + FILTERS
      ======================================== */}

      <div className="
        relative
        bg-slate-950/55
        backdrop-blur-2xl
        border border-white/10
        rounded-3xl
        shadow-xl shadow-black/10
        p-4 sm:p-5
        mb-6
        overflow-hidden
      ">

        <div className="absolute -top-20 right-10 w-48 h-48 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="relative flex items-center gap-2 mb-4">
          <Search className="w-4 h-4 text-blue-300" />
          <h2 className="text-sm font-semibold text-white">
            Search & Filters
          </h2>

          {(searchTerm || roleFilter !== "All" || statusFilter !== "All") && (
            <span className="ml-auto text-xs text-blue-300">
              {filteredEmployees.length} result
              {filteredEmployees.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-3">

          {/* Search */}

          <div className="relative">

            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />

            <input
              type="text"
              placeholder="Search employee..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="
                w-full
                border border-white/10
                rounded-xl
                py-3
                pl-10
                pr-4
                text-sm
                text-white
                bg-white/5
                placeholder:text-white/30
                outline-none
                focus:border-blue-400/40
                focus:ring-2
                focus:ring-blue-500/10
                transition-all
              "
            />

          </div>

          {/* Role */}

          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="
              w-full
              border border-white/10
              rounded-xl
              px-4 py-3
              text-sm
              text-white
              bg-slate-900/70
              outline-none
              focus:border-blue-400/40
              transition-all
            "
          >
            <option value="All" className="bg-slate-900">
              All Roles
            </option>
            <option value="Admin" className="bg-slate-900">
              Admin
            </option>
            <option value="Manager" className="bg-slate-900">
              Manager
            </option>
            <option value="Employee" className="bg-slate-900">
              Employee
            </option>
          </select>

          {/* Status */}

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="
              w-full
              border border-white/10
              rounded-xl
              px-4 py-3
              text-sm
              text-white
              bg-slate-900/70
              outline-none
              focus:border-blue-400/40
              transition-all
            "
          >
            <option value="All" className="bg-slate-900">
              All Status
            </option>
            <option value="Active" className="bg-slate-900">
              Active
            </option>
            <option value="Inactive" className="bg-slate-900">
              Inactive
            </option>
          </select>

        </div>
      </div>

      {/* ========================================
          DESKTOP TABLE
      ======================================== */}

      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-12 text-center text-sm text-white/50">
          Loading employees...
        </div>
      ) : (
        <>
      <div className="
        hidden lg:block
        bg-slate-950/55
        backdrop-blur-2xl
        border border-white/10
        rounded-3xl
        shadow-2xl shadow-black/15
        overflow-hidden
      ">

        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">

          <div>
            <h2 className="font-bold text-white text-lg">
              Team Members
            </h2>

            <p className="text-xs text-white/40 mt-1">
              {filteredEmployees.length} of {employees.length} employees
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-white/40">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            Staff access management
          </div>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1000px]">

            <thead className="bg-white/[0.03] border-b border-white/10">

              <tr>

                {[
                  "Employee",
                  "Phone",
                  "Email",
                  "Role",
                  "Status",
                  "Joined",
                  "Actions",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="
                      text-left
                      px-5 py-4
                      text-[11px]
                      uppercase
                      tracking-wider
                      text-white/40
                      font-semibold
                    "
                  >
                    {heading}
                  </th>
                ))}

              </tr>

            </thead>

            <tbody>

              {filteredEmployees.length > 0 ? (

                filteredEmployees.map((employee) => (

                  <tr
                    key={employee.id}
                    className="
                      border-b border-white/[0.06]
                      last:border-0
                      hover:bg-blue-500/[0.04]
                      transition-all duration-300
                    "
                  >

                    {/* Employee */}

                    <td className="px-5 py-5">

                      <div className="flex items-center gap-3">

                        <EmployeeAvatar name={employee.name} />

                        <div>
                          <p className="font-semibold text-white">
                            {employee.name}
                          </p>

                          <p className="text-xs text-white/35 mt-1">
                            ID #{employee.id}
                          </p>
                        </div>

                      </div>

                    </td>

                    {/* Phone */}

                    <td className="px-5 py-5">

                      <div className="flex items-center gap-2 text-sm text-white/65">
                        <Phone className="w-3.5 h-3.5 text-blue-300/70" />
                        {employee.phone}
                      </div>

                    </td>

                    {/* Email */}

                    <td className="px-5 py-5">

                      <div className="flex items-center gap-2 text-sm text-white/65">
                        <Mail className="w-3.5 h-3.5 text-violet-300/70" />
                        {employee.email}
                      </div>

                    </td>

                    {/* Role */}

                    <td className="px-5 py-5">

                      <span
                        className={`
                          ${getRoleStyle(employee.role)}
                          inline-flex items-center
                          px-3 py-1.5
                          rounded-full
                          text-xs font-semibold
                          border
                        `}
                      >
                        {employee.role}
                      </span>

                    </td>

                    {/* Status */}

                    <td className="px-5 py-5">

                      <span
                        className={`
                          ${getStatusStyle(employee.status)}
                          inline-flex items-center gap-1.5
                          px-3 py-1.5
                          rounded-full
                          text-xs font-semibold
                          border
                        `}
                      >

                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            employee.status === "Active"
                              ? "bg-emerald-400"
                              : "bg-red-400"
                          }`}
                        />

                        {employee.status}

                      </span>

                    </td>

                    {/* Joined */}

                    <td className="px-5 py-5">

                      <div className="flex items-center gap-2 text-sm text-white/50">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {employee.joined}
                      </div>

                    </td>

                    {/* Actions */}

                    <td className="px-5 py-5">

                      <span className="text-xs text-white/35">
                        API managed
                      </span>

                    </td>

                  </tr>

                ))

              ) : (

                <tr>
                  <td colSpan="7">
                    <EmptyState />
                  </td>
                </tr>

              )}

            </tbody>

          </table>

        </div>
      </div>

      {/* ========================================
          MOBILE CARDS
      ======================================== */}

      <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">

        {filteredEmployees.length > 0 ? (

          filteredEmployees.map((employee) => (

            <div
              key={employee.id}
              className="
                group
                bg-slate-950/60
                backdrop-blur-2xl
                border border-white/10
                rounded-3xl
                shadow-xl shadow-black/15
                p-5
                hover:-translate-y-1
                hover:border-blue-400/20
                hover:shadow-2xl
                transition-all duration-300
              "
            >

              <div className="flex justify-between items-start gap-3">

                <div className="flex items-center gap-3">

                  <EmployeeAvatar name={employee.name} />

                  <div>

                    <h3 className="font-bold text-white">
                      {employee.name}
                    </h3>

                    <p className="text-xs text-white/35 mt-1">
                      ID #{employee.id}
                    </p>

                  </div>

                </div>

                <span
                  className={`
                    ${getStatusStyle(employee.status)}
                    px-2.5 py-1
                    rounded-full
                    text-[11px]
                    font-semibold
                    border
                  `}
                >
                  {employee.status}
                </span>

              </div>

              <div className="mt-4">

                <span
                  className={`
                    ${getRoleStyle(employee.role)}
                    inline-flex
                    px-3 py-1.5
                    rounded-full
                    text-xs font-semibold
                    border
                  `}
                >
                  {employee.role}
                </span>

              </div>

              <div className="mt-5 py-4 border-y border-white/[0.07] space-y-4">

                <div>
                  <p className="text-[11px] uppercase tracking-wider text-white/30 mb-1">
                    Email
                  </p>

                  <div className="flex items-start gap-2 text-sm text-white/65 break-all">
                    <Mail className="w-4 h-4 mt-0.5 shrink-0 text-violet-300/70" />
                    {employee.email}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-wider text-white/30 mb-1">
                    Phone
                  </p>

                  <div className="flex items-center gap-2 text-sm text-white/65">
                    <Phone className="w-4 h-4 text-blue-300/70" />
                    {employee.phone}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-wider text-white/30 mb-1">
                    Joined
                  </p>

                  <div className="flex items-center gap-2 text-sm text-white/65">
                    <CalendarDays className="w-4 h-4 text-cyan-300/70" />
                    {employee.joined}
                  </div>
                </div>

              </div>

              <div className="mt-5 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-center text-xs text-white/35">
                Staff details are managed through the backend invitation flow.
              </div>

            </div>

          ))

        ) : (

          <div className="sm:col-span-2">
            <EmptyState />
          </div>

        )}

      </div>
        </>
      )}

      {/* ========================================
          ADD MODAL
      ======================================== */}

      {showAddModal && (
        <Modal
          title="Add New Employee"
          subtitle="Create a new staff profile for your store."
          icon={<UserPlus className="w-5 h-5" />}
          onClose={closeAddModal}
        >
          <EmployeeForm
            form={form}
            onChange={handleChange}
            onSubmit={handleAddEmployee}
            onCancel={closeAddModal}
            submitText="Add Employee"
          />
        </Modal>
      )}

    </div>
  );
}

// ========================================
// STAT CARD
// ========================================

function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconStyle,
}) {
  return (
    <div
      className="
        group
        relative
        overflow-hidden
        bg-white/[0.92]
        backdrop-blur-xl
        border border-white/30
        rounded-2xl
        p-4 sm:p-5
        shadow-xl shadow-black/10
        hover:-translate-y-1.5
        hover:shadow-2xl
        transition-all duration-300
      "
    >

      <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-blue-500/5 blur-2xl" />

      <div className="relative flex items-start justify-between gap-3">

        <div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            {title}
          </p>

          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
            {value}
          </h2>
        </div>

        <div
          className={`
            w-10 h-10 sm:w-11 sm:h-11
            rounded-xl
            border
            flex items-center justify-center
            transition-transform duration-300
            group-hover:scale-110
            ${iconStyle}
          `}
        >
          {icon}
        </div>

      </div>

      <p className="relative text-xs text-slate-400 mt-3">
        {subtitle}
      </p>

    </div>
  );
}

// ========================================
// EMPLOYEE AVATAR
// ========================================

function EmployeeAvatar({ name }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="
        w-11 h-11
        shrink-0
        rounded-xl
        bg-gradient-to-br from-blue-500/20 to-violet-500/20
        border border-blue-400/15
        flex items-center justify-center
        text-sm font-bold
        text-blue-200
        shadow-inner
      "
    >
      {initials}
    </div>
  );
}

// ========================================
// EMPTY STATE
// ========================================

function EmptyState() {
  return (
    <div
      className="
        bg-slate-950/50
        rounded-3xl
        p-12 sm:p-16
        text-center
        border border-white/10
      "
    >

      <div
        className="
          w-16 h-16
          mx-auto
          rounded-2xl
          bg-blue-500/10
          border border-blue-400/10
          flex items-center justify-center
          mb-5
        "
      >
        <Users className="w-7 h-7 text-blue-300/70" />
      </div>

      <h3 className="font-bold text-white text-lg">
        No employees found
      </h3>

      <p className="text-sm text-white/40 mt-2">
        Try changing your search or filters.
      </p>

    </div>
  );
}

// ========================================
// EMPLOYEE FORM
// ========================================

function EmployeeForm({
  form,
  onChange,
  onSubmit,
  onCancel,
  submitText,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">

      <FormInput
        label="Employee Name"
        name="name"
        value={form.name}
        onChange={onChange}
        placeholder="e.g. Rahul Sharma"
        icon={<Users className="w-4 h-4" />}
      />

      <FormInput
        label="Phone"
        name="phone"
        type="tel"
        value={form.phone}
        onChange={onChange}
        placeholder="10-digit phone number"
        icon={<Phone className="w-4 h-4" />}
      />

      <FormInput
        label="Email"
        name="email"
        type="email"
        value={form.email}
        onChange={onChange}
        placeholder="employee@retailiq.com"
        icon={<Mail className="w-4 h-4" />}
      />

      <div>
        <label className="block text-sm font-semibold text-white/80 mb-2">
          Role
        </label>

        <div className="relative">
          <BriefcaseBusiness className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />

          <select
            name="role"
            value={form.role}
            onChange={onChange}
            className="
              w-full
              border border-white/10
              rounded-xl
              py-3
              pl-10
              pr-4
              text-sm
              text-white
              bg-white/5
              outline-none
              focus:border-blue-400/40
              focus:ring-2
              focus:ring-blue-500/10
              transition-all
            "
          >
            <option value="Employee" className="bg-slate-900">
              Employee
            </option>
            <option value="Manager" className="bg-slate-900">
              Manager
            </option>
            <option value="Admin" className="bg-slate-900">
              Admin
            </option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-white/80 mb-2">
          Status
        </label>

        <div className="relative">
          <CircleAlert className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />

          <select
            name="status"
            value={form.status}
            onChange={onChange}
            className="
              w-full
              border border-white/10
              rounded-xl
              py-3
              pl-10
              pr-4
              text-sm
              text-white
              bg-white/5
              outline-none
              focus:border-blue-400/40
              focus:ring-2
              focus:ring-blue-500/10
              transition-all
            "
          >
            <option value="Active" className="bg-slate-900">
              Active
            </option>
            <option value="Inactive" className="bg-slate-900">
              Inactive
            </option>
          </select>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">

        <button
          type="button"
          onClick={onCancel}
          className="
            flex-1
            border border-white/10
            bg-white/5
            text-white/60
            py-3
            rounded-xl
            font-semibold
            hover:bg-white/10
            hover:text-white
            transition-all
          "
        >
          Cancel
        </button>

        <button
          type="submit"
          className="
            flex-1
            bg-gradient-to-r
            from-blue-500
            to-indigo-500
            text-white
            py-3
            rounded-xl
            font-semibold
            shadow-lg shadow-blue-500/20
            hover:from-blue-400
            hover:to-indigo-400
            active:scale-[0.98]
            transition-all
          "
        >
          {submitText}
        </button>

      </div>

    </form>
  );
}

// ========================================
// FORM INPUT
// ========================================

function FormInput({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  icon,
}) {
  return (
    <div>

      <label className="block text-sm font-semibold text-white/80 mb-2">
        {label}
      </label>

      <div className="relative">

        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none">
          {icon}
        </div>

        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="
            w-full
            border border-white/10
            rounded-xl
            py-3
            pl-10
            pr-4
            text-sm
            text-white
            bg-white/5
            placeholder:text-white/25
            outline-none
            focus:border-blue-400/40
            focus:ring-2
            focus:ring-blue-500/10
            transition-all
          "
        />

      </div>

    </div>
  );
}

// ========================================
// MODAL
// ========================================

function Modal({
  title,
  subtitle,
  icon,
  onClose,
  children,
}) {
  return (
    <div
      className="
        fixed inset-0
        z-[100]
        bg-black/70
        backdrop-blur-md
        flex items-center justify-center
        p-4
      "
    >

      <div
        className="
          bg-slate-950
          w-full max-w-lg
          max-h-[90vh]
          overflow-y-auto
          rounded-3xl
          border border-white/10
          shadow-2xl shadow-black/50
          p-5 sm:p-7
          animate-[fadeIn_0.25s_ease-out]
        "
      >

        <div className="flex justify-between items-start gap-4 mb-7">

          <div className="flex items-start gap-3">

            <div
              className="
                w-11 h-11
                shrink-0
                rounded-xl
                bg-blue-500/10
                border border-blue-400/15
                flex items-center justify-center
                text-blue-300
              "
            >
              {icon}
            </div>

            <div>

              <h2 className="text-xl sm:text-2xl font-bold text-white">
                {title}
              </h2>

              <p className="text-sm text-white/40 mt-1">
                {subtitle}
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              w-9 h-9
              shrink-0
              rounded-xl
              bg-white/5
              border border-white/10
              text-white/40
              flex items-center justify-center
              hover:bg-red-500/10
              hover:border-red-400/10
              hover:text-red-300
              transition-all
            "
          >
            <X className="w-5 h-5" />
          </button>

        </div>

        {children}

      </div>

    </div>
  );
}

export default Employee;