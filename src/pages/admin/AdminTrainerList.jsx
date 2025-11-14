import { useEffect, useState } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import {
  Table,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Button,
  message,
  DatePicker,
  Spin,
} from "antd";
import api from "../../config/axios";
import dayjs from "dayjs";

const { Option } = Select;

export default function AdminTrainerList() {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(false);

  // form thêm mới (giữ các trường theo API)
  const [newT, setNewT] = useState({
    fullName: "",
    email: "",
    password: "",
    phoneNumber: "",
    gender: "Male", // Male / Female / Other
    address: "",
    dateOfBirth: null, // ISO string
  });

  // modal sửa local
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  // helper: split full name -> firstName + lastName (last token là lastName)
  const splitName = (fullname) => {
    const parts = (fullname || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return { firstName: "", lastName: "" };
    if (parts.length === 1) return { firstName: parts[0], lastName: "" };
    const lastName = parts.pop();
    const firstName = parts.join(" ");
    return { firstName, lastName };
  };

  // === Fetch trainers ===
  const fetchTrainers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/Admin/users");
      const raw = Array.isArray(res.data) ? res.data : res.data.items || res.data.data || [];
      // filter trainer by roleName/roleId/roles
      const filtered = raw.filter((u) => {
        if (!u) return false;
        if (u.roleName && typeof u.roleName === "string") {
          return u.roleName.toLowerCase() === "trainer";
        }
        if (u.roleId) return Number(u.roleId) === 5;
        if (u.roles && Array.isArray(u.roles)) {
          return u.roles.some(
            (r) => (r.name || "").toLowerCase() === "trainer" || Number(r.id) === 5
          );
        }
        return false;
      });

      const mapped = filtered.map((u) => ({
        id: u.userId || u.id || u.user?.id,
        firstName: u.firstName || "",
        lastName: u.lastName || "",
        name:
          `${u.firstName || ""}${u.firstName && u.lastName ? " " : ""}${u.lastName || ""}`.trim() ||
          u.fullName ||
          u.name ||
          "",
        email: u.email,
        phone: u.phoneNumber || u.phone,
        gender: u.gender === "Male" ? "Nam" : u.gender === "Female" ? "Nữ" : u.gender || "Khác",
        address: u.address || "",
        dateOfBirth: u.dateOfBirth || null,
        raw: u,
      }));

      setTrainers(mapped);
    } catch (err) {
      console.error("fetch trainers error", err);
      message.error("Lấy danh sách HLV thất bại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // === validate local ===
  const validateNew = () => {
    if (!newT.fullName.trim()) {
      message.error("Vui lòng nhập họ & tên.");
      return false;
    }
    if (!newT.email || !/\S+@\S+\.\S+/.test(newT.email)) {
      message.error("Email không hợp lệ.");
      return false;
    }
    if (!newT.password || newT.password.length < 6) {
      message.error("Password tối thiểu 6 ký tự.");
      return false;
    }
    if (!newT.phoneNumber || newT.phoneNumber.replace(/\D/g, "").length < 9) {
      message.error("Số điện thoại không hợp lệ.");
      return false;
    }
    return true;
  };

  // === Create trainer (API) roleId = 5 ===
  const handleAdd = async (ev) => {
    ev?.preventDefault?.();
    if (!validateNew()) return;

    const { firstName, lastName } = splitName(newT.fullName);
    const body = {
      email: newT.email,
      password: newT.password,
      firstName: firstName || "",
      lastName: lastName || "",
      phoneNumber: newT.phoneNumber,
      gender: newT.gender || "Male",
      address: newT.address || "",
      dateOfBirth: newT.dateOfBirth ? dayjs(newT.dateOfBirth).toISOString() : new Date().toISOString(),
      roleId: 5,
    };

    try {
      message.loading({ content: "Đang tạo tài khoản...", key: "createTrainer" });
      const res = await api.post("/Admin/create-user", body);
      message.success({ content: "Tạo tài khoản HLV thành công", key: "createTrainer", duration: 2 });

      // refresh danh sách từ server
      await fetchTrainers();

      // reset form
      setNewT({
        fullName: "",
        email: "",
        password: "",
        phoneNumber: "",
        gender: "Male",
        address: "",
        dateOfBirth: null,
      });
    } catch (err) {
      console.error("create trainer error", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        "Tạo tài khoản thất bại";
      message.error({ content: Array.isArray(msg) ? msg.join(", ") : String(msg), duration: 4 });
    }
  };

  // === Delete user (try API) ===
  const handleDelete = async (record) => {
    if (!window.confirm("Bạn có chắc muốn xoá HLV này?")) return;
    try {
      const userId = record?.raw?.userId || record?.id;
      if (userId) {
        await api.delete(`/Admin/users/${userId}`);
        message.success("Xóa tài khoản thành công");
        await fetchTrainers();
        return;
      }
    } catch (err) {
      console.warn("delete API failed", err);
      message.error("Xóa tài khoản trên server thất bại");
    }
    // fallback local
    setTrainers((p) => p.filter((t) => t.id !== record.id));
    message.success("Đã xóa (local)");
  };

  // === Edit modal (local update only) ===
  const handleEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({
      name: record.name,
      age: record.age || undefined,
      gender: record.gender === "Nam" ? "Nam" : record.gender === "Nữ" ? "Nữ" : record.gender,
      email: record.email,
      phone: record.phone,
      address: record.address,
      dateOfBirth: record.dateOfBirth ? dayjs(record.dateOfBirth) : null,
      photo: record.photo,
    });
    setOpen(true);
  };

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      // local update only (server-side update endpoint not assumed)
      setTrainers((prev) =>
        prev.map((t) =>
          t.id === editing.id
            ? {
                ...t,
                name: values.name,
                email: values.email,
                phone: values.phone,
                gender: values.gender,
                address: values.address,
                dateOfBirth: values.dateOfBirth ? values.dateOfBirth.toISOString() : t.dateOfBirth,
                photo: values.photo || t.photo,
              }
            : t
        )
      );
      setOpen(false);
      setEditing(null);
      message.success("Cập nhật thành công (local)");
    } catch (err) {
      // validation failed
    }
  };

  const columns = [
    {
      title: "Ảnh",
      dataIndex: "photo",
      key: "photo",
      width: 90,
      render: (src, r) => (
        <img
          src={src || "/img/useravt.jpg"}
          alt={r.name}
          style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }}
          onError={(e) => (e.currentTarget.src = "/img/useravt.jpg")}
        />
      ),
    },
    {
      title: "Tên",
      dataIndex: "name",
      key: "name",
      width: 220,
      fixed: "left",
      ellipsis: true,
      sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 240,
      render: (v) => (v ? <a href={`mailto:${v}`}>{v}</a> : "—"),
    },
    {
      title: "SĐT",
      dataIndex: "phone",
      key: "phone",
      width: 140,
      render: (v) => (v ? <a href={`tel:${v}`}>{v}</a> : "—"),
    },
    {
      title: "Giới tính",
      dataIndex: "gender",
      key: "gender",
      width: 110,
    },
    {
      title: "Ngày sinh",
      dataIndex: "dateOfBirth",
      key: "dateOfBirth",
      width: 140,
      render: (v) => (v ? dayjs(v).format("DD/MM/YYYY") : "—"),
    },
    {
      title: "Địa chỉ",
      dataIndex: "address",
      key: "address",
      width: 200,
      ellipsis: true,
    },
    {
      title: "Thao tác",
      key: "action",
      fixed: "right",
      width: 200,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => handleEdit(record)}>
            Sửa
          </Button>
          <Button size="small" danger onClick={() => handleDelete(record)}>
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="container-fluid py-5">
      <div className="row g-4">
        <div className="col-lg-3">
          <AdminSidebar />
        </div>

        <div className="col-lg-9">
          <h2 className="mb-4 text-center">Quản lý Huấn luyện viên</h2>

          {/* Form thêm */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h5 className="mb-3">Thêm HLV mới (tạo tài khoản)</h5>

              <form onSubmit={handleAdd}>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">Họ & tên</label>
                    <input
                      name="fullName"
                      className="form-control"
                      placeholder="VD: Nguyễn Văn A"
                      value={newT.fullName}
                      onChange={(e) => setNewT((p) => ({ ...p, fullName: e.target.value }))}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Email</label>
                    <input
                      name="email"
                      type="email"
                      className="form-control"
                      placeholder="VD: abc@xyz.com"
                      value={newT.email}
                      onChange={(e) => setNewT((p) => ({ ...p, email: e.target.value }))}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Mật khẩu</label>
                    <input
                      name="password"
                      type="password"
                      className="form-control"
                      placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                      value={newT.password}
                      onChange={(e) => setNewT((p) => ({ ...p, password: e.target.value }))}
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label">Số điện thoại</label>
                    <input
                      name="phoneNumber"
                      className="form-control"
                      placeholder="VD: 0901234567"
                      value={newT.phoneNumber}
                      onChange={(e) => setNewT((p) => ({ ...p, phoneNumber: e.target.value }))}
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label">Giới tính</label>
                    <select
                      name="gender"
                      className="form-select"
                      value={newT.gender}
                      onChange={(e) => setNewT((p) => ({ ...p, gender: e.target.value }))}
                    >
                      <option value="Male">Nam</option>
                      <option value="Female">Nữ</option>
                      <option value="Other">Khác</option>
                    </select>
                  </div>

                  <div className="col-md-3">
                    <label className="form-label">Ngày sinh</label>
                    <DatePicker
                      style={{ width: "100%" }}
                      value={newT.dateOfBirth ? dayjs(newT.dateOfBirth) : null}
                      onChange={(d) => setNewT((p) => ({ ...p, dateOfBirth: d ? d.toISOString() : null }))}
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label">Địa chỉ</label>
                    <input
                      name="address"
                      className="form-control"
                      placeholder="Địa chỉ"
                      value={newT.address}
                      onChange={(e) => setNewT((p) => ({ ...p, address: e.target.value }))}
                    />
                  </div>

                  <div className="col-md-12 text-end">
                    <button className="btn btn-add" type="submit">
                      Tạo tài khoản HLV
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Table */}
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="mb-3">Danh sách HLV</h5>
              {loading ? (
                <div className="text-center py-5"><Spin /></div>
              ) : (
                <Table
                  rowKey="id"
                  columns={columns}
                  dataSource={trainers}
                  pagination={{ pageSize: 8 }}
                  scroll={{ x: "max-content" }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal sửa (local) */}
      <Modal
        title="Cập nhật HLV"
        open={open}
        onCancel={() => {
          setOpen(false);
          setEditing(null);
        }}
        onOk={handleUpdate}
        okText="Lưu thay đổi"
        cancelText="Huỷ"
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          preserve={false}
          initialValues={{ gender: "Nam", photo: "/img/useravt.jpg" }}
        >
          <Form.Item name="name" label="Tên" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Space style={{ width: "100%" }} size="middle" wrap>
            <Form.Item name="age" label="Tuổi">
              <InputNumber min={16} style={{ width: 160 }} />
            </Form.Item>

            <Form.Item name="gender" label="Giới tính">
              <Select style={{ width: 160 }}>
                <Option value="Nam">Nam</Option>
                <Option value="Nữ">Nữ</Option>
                <Option value="Khác">Khác</Option>
              </Select>
            </Form.Item>

            <Form.Item name="dateOfBirth" label="Ngày sinh">
              <DatePicker style={{ width: 180 }} />
            </Form.Item>
          </Space>

          <Form.Item name="email" label="Email" rules={[{ type: "email" }]}>
            <Input />
          </Form.Item>

          <Form.Item name="phone" label="Số điện thoại">
            <Input />
          </Form.Item>

          <Form.Item name="address" label="Địa chỉ">
            <Input />
          </Form.Item>

          <Form.Item name="photo" label="Ảnh (URL)">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
