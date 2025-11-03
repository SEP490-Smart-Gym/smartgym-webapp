import { useState } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import {
  Table,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Tag,
  Space,
  Button,
  Popconfirm,
  message,
} from "antd";

const { Option } = Select;

export default function AdminTrainerList() {
  const [trainers, setTrainers] = useState([
    {
      id: 101,
      name: "John Doe",
      age: 32,
      gender: "Nam",
      experienceYears: 8,
      skills: ["Strength", "Mobility", "HIIT"],
      email: "john@example.com",
      phone: "0901234567",
      certificates: ["NASM-CPT", "CPR/AED"],
      photo: "/img/team-1.jpg",
    },
    {
      id: 102,
      name: "Emily Smith",
      age: 28,
      gender: "Nữ",
      experienceYears: 5,
      skills: ["Yoga", "Pilates"],
      email: "emily@example.com",
      phone: "0912345678",
      certificates: ["RYT-200"],
      photo: "/img/team-2.jpg",
    },
  ]);

  // State form thêm mới
  const [newT, setNewT] = useState({
    name: "",
    age: "",
    gender: "Nam",
    experienceYears: "",
    skills: "",
    email: "",
    phone: "",
    certificates: "",
    photo: "",
  });

  const handleInputNew = (e) => {
    const { name, value } = e.target;
    setNewT((prev) => ({ ...prev, [name]: value }));
  };

  const validateNew = () => {
    if (!newT.name.trim()) return alert("Vui lòng nhập tên HLV!");
    if (!newT.age || Number(newT.age) <= 0) return alert("Tuổi phải là số dương!");
    if (!newT.email.includes("@")) return alert("Email không hợp lệ!");
    if (!newT.phone || newT.phone.replace(/\D/g, "").length < 9)
      return alert("SĐT không hợp lệ!");
    return true;
  };

  const handleAdd = () => {
    if (!validateNew()) return;

    const skillsArr = newT.skills.split(",").map((s) => s.trim()).filter(Boolean);
    const certArr = newT.certificates.split(",").map((c) => c.trim()).filter(Boolean);

    const newTrainer = {
      id: Date.now(),
      name: newT.name.trim(),
      age: Number(newT.age),
      gender: newT.gender,
      experienceYears: Number(newT.experienceYears || 0),
      skills: skillsArr,
      email: newT.email.trim(),
      phone: newT.phone.trim(),
      certificates: certArr,
      photo: newT.photo || "/img/useravt.jpg",
    };

    setTrainers((prev) => [newTrainer, ...prev]);
    setNewT({
      name: "",
      age: "",
      gender: "Nam",
      experienceYears: "",
      skills: "",
      email: "",
      phone: "",
      certificates: "",
      photo: "",
    });
    message.success("Đã thêm huấn luyện viên mới!");
  };

  // === Update bằng Modal ===
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const handleEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({
      ...record,
      skills: (record.skills || []).join(", "),
      certificates: (record.certificates || []).join(", "),
    });
    setOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Bạn có chắc muốn xoá HLV này?")) {
      setTrainers((prev) => prev.filter((t) => t.id !== id));
      message.success("Đã xoá HLV");
    }
  };

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      const skillsArr = (values.skills || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const certArr = (values.certificates || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      setTrainers((prev) =>
        prev.map((t) =>
          t.id === editing.id
            ? {
                ...t,
                ...values,
                age: Number(values.age),
                experienceYears: Number(values.experienceYears || 0),
                skills: skillsArr,
                certificates: certArr,
                photo: values.photo || "/img/useravt.jpg",
              }
            : t
        )
      );

      setOpen(false);
      setEditing(null);
      message.success("Cập nhật thành công");
    } catch {}
  };

  // === Cấu hình bảng AntD ===
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
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            objectFit: "cover",
          }}
          onError={(e) => (e.currentTarget.src = "/img/useravt.jpg")}
        />
      ),
    },
    {
      title: "Tên",
      dataIndex: "name",
      key: "name",
      fixed: "left",
      width: 200,
      ellipsis: true,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    { title: "Tuổi", dataIndex: "age", key: "age", width: 90 },
    { title: "Giới tính", dataIndex: "gender", key: "gender", width: 100 },
    {
      title: "KN (năm)",
      dataIndex: "experienceYears",
      key: "experienceYears",
      width: 120,
    },
    {
      title: "Kỹ năng",
      dataIndex: "skills",
      key: "skills",
      width: 260,
      render: (arr) =>
        Array.isArray(arr) && arr.length ? (
          <Space wrap size={4}>
            {arr.map((s, i) => (
              <Tag key={i} color="blue">
                {s}
              </Tag>
            ))}
          </Space>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 250,
      render: (v) => (v ? <a href={`mailto:${v}`}>{v}</a> : "—"),
    },
    {
      title: "SĐT",
      dataIndex: "phone",
      key: "phone",
      width: 150,
      render: (v) => (v ? <a href={`tel:${v}`}>{v}</a> : "—"),
    },
    {
      title: "Chứng chỉ",
      dataIndex: "certificates",
      key: "certificates",
      width: 280,
      render: (arr) =>
        Array.isArray(arr) && arr.length ? (
          <Space wrap size={4}>
            {arr.map((s, i) => (
              <Tag key={i}>{s}</Tag>
            ))}
          </Space>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      title: "Thao tác",
      key: "action",
      fixed: "right",
      width: 160,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => handleEdit(record)}>
            Sửa
          </Button>
          <Button size="small" danger onClick={() => handleDelete(record.id)}>
            Xoá
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="container-fluid py-5">
      <div className="row g-4">
        {/* Sidebar */}
        <div className="col-lg-3">
          <AdminSidebar />
        </div>

        {/* Nội dung chính */}
        <div className="col-lg-9">
          <h2 className="mb-4 text-center">Quản lý Huấn luyện viên</h2>

          {/* Form thêm HLV mới */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h5 className="mb-3">Thêm HLV mới</h5>

              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Tên</label>
                  <input
                    name="name"
                    className="form-control"
                    placeholder="VD: Nguyễn Văn A"
                    value={newT.name}
                    onChange={handleInputNew}
                  />
                </div>

                <div className="col-md-2">
                  <label className="form-label">Tuổi</label>
                  <input
                    name="age"
                    type="number"
                    min="16"
                    className="form-control"
                    placeholder="VD: 28"
                    value={newT.age}
                    onChange={handleInputNew}
                  />
                </div>

                <div className="col-md-2">
                  <label className="form-label">Giới tính</label>
                  <select
                    name="gender"
                    className="form-select"
                    value={newT.gender}
                    onChange={handleInputNew}
                  >
                    <option>Nam</option>
                    <option>Nữ</option>
                    <option>Khác</option>
                  </select>
                </div>

                <div className="col-md-4">
                  <label className="form-label">Số năm kinh nghiệm</label>
                  <input
                    name="experienceYears"
                    type="number"
                    min="0"
                    className="form-control"
                    placeholder="VD: 5"
                    value={newT.experienceYears}
                    onChange={handleInputNew}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Kỹ năng</label>
                  <input
                    name="skills"
                    className="form-control"
                    placeholder="VD: Strength, Mobility"
                    value={newT.skills}
                    onChange={handleInputNew}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Chứng chỉ</label>
                  <input
                    name="certificates"
                    className="form-control"
                    placeholder="VD: NASM-CPT, RYT-200"
                    value={newT.certificates}
                    onChange={handleInputNew}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <input
                    name="email"
                    type="email"
                    className="form-control"
                    placeholder="VD: abc@xyz.com"
                    value={newT.email}
                    onChange={handleInputNew}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Số điện thoại</label>
                  <input
                    name="phone"
                    className="form-control"
                    placeholder="VD: 0901234567"
                    value={newT.phone}
                    onChange={handleInputNew}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Ảnh (URL)</label>
                  <input
                    name="photo"
                    className="form-control"
                    placeholder="VD: https://..."
                    value={newT.photo}
                    onChange={handleInputNew}
                  />
                </div>

                <div className="col-md-6 d-flex align-items-end">
                  <div className="d-flex align-items-center gap-3">
                    <img
                      src={newT.photo || "/img/useravt.jpg"}
                      alt="preview"
                      width="64"
                      height="64"
                      className="rounded-circle object-fit-cover"
                      onError={(e) => (e.currentTarget.src = "/img/useravt.jpg")}
                    />
                    <button className="btn btn-add" onClick={handleAdd}>
                      Thêm HLV
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Danh sách HLV */}
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="mb-3">Danh sách HLV</h5>

              <Table
                rowKey="id"
                columns={columns}
                dataSource={trainers}
                pagination={{ pageSize: 8 }}
                scroll={{ x: "max-content" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal update */}
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
          <Form.Item
            name="name"
            label="Tên"
            rules={[{ required: true, message: "Vui lòng nhập tên" }]}
          >
            <Input placeholder="VD: Nguyễn Văn A" />
          </Form.Item>

          <Space style={{ width: "100%" }} size="middle" wrap>
            <Form.Item
              name="age"
              label="Tuổi"
              rules={[{ required: true, message: "Vui lòng nhập tuổi" }]}
            >
              <InputNumber min={16} style={{ width: 160 }} />
            </Form.Item>

            <Form.Item name="gender" label="Giới tính">
              <Select style={{ width: 160 }}>
                <Option value="Nam">Nam</Option>
                <Option value="Nữ">Nữ</Option>
                <Option value="Khác">Khác</Option>
              </Select>
            </Form.Item>

            <Form.Item name="experienceYears" label="Kinh nghiệm (năm)">
              <InputNumber min={0} style={{ width: 180 }} />
            </Form.Item>
          </Space>

          <Form.Item name="skills" label="Kỹ năng (cách nhau bằng dấu phẩy)">
            <Input placeholder="VD: Strength, Mobility, HIIT" />
          </Form.Item>

          <Form.Item name="certificates" label="Chứng chỉ (cách nhau bằng dấu phẩy)">
            <Input placeholder="VD: NASM-CPT, RYT-200" />
          </Form.Item>

          <Form.Item name="email" label="Email" rules={[{ type: "email" }]}>
            <Input />
          </Form.Item>

          <Form.Item name="phone" label="Số điện thoại">
            <Input />
          </Form.Item>

          <Form.Item name="photo" label="Ảnh (URL)">
            <Input placeholder="https://..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
