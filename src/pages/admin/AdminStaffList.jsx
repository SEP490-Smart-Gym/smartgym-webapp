// AdminStaffList.jsx
import { useEffect, useState } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import { Table, Space, Button, Modal, Form, Input, DatePicker, Select, message, Spin } from "antd";
import api from "../../config/axios";
import dayjs from "dayjs";

const GENDER_OPTIONS = [
  { label: "Nam", value: "Male" },
  { label: "Nữ", value: "Female" },
  { label: "Khác", value: "Other" },
];



export default function AdminStaffList() {
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(false);

  // form add (không modal)
  const [addForm] = Form.useForm();

  // edit modal
  const [editForm] = Form.useForm();
  const [editingStaff, setEditingStaff] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  // fetch danh sách từ API
  const fetchStaffs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/Admin/users");
      const data = Array.isArray(res.data) ? res.data : res.data.items || [];
      const staffList = data.filter(
        (u) => u.roleName && u.roleName.toLowerCase() === "staff"
      );

      setStaffs(staffList);
    } catch (err) {
      console.error(err);
      message.error("Lấy danh sách nhân viên thất bại");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchStaffs();
  }, []);
  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  };


  // ===== Thêm nhân viên (POST) =====
  const handleAdd = async (values) => {
    const autoPassword = generatePassword();

    const body = {
      email: values.email,
      password: autoPassword,
      firstName: values.firstName,
      lastName: values.lastName,
      phoneNumber: values.phoneNumber,
      gender: values.gender,
      address: values.address || "",
      dateOfBirth: values.dateOfBirth ? dayjs(values.dateOfBirth).toISOString() : new Date().toISOString(),
      roleId: 3, // staff
    };

    try {
      const res = await api.post("/Admin/create-user", body);

      const created = res.data;
      setStaffs((prev) => [created, ...prev]);
      // console.log(autoPassword);

      Modal.success({
        title: "Tạo nhân viên thành công!",
        content: (
          <div>
            Mật khẩu đăng nhập:
            <br />
            <strong>{autoPassword}</strong>
          </div>
        )
      });
      // message.success(
      //   <div>
      //     Tạo nhân viên thành công! <br />
      //     Mật khẩu: <strong>{autoPassword}</strong>
      //   </div>
      // );


      addForm.resetFields();

    } catch (err) {
      const detail = err?.response?.data?.message || err?.response?.data || err.message;
      message.error("Tạo nhân viên thất bại: " + (detail || ""));
    }
  };

  // ===== Xóa (DELETE) =====
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa nhân viên này?")) return;
    try {
      await api.delete(`/Admin/user/${id}`);
      setStaffs((prev) => prev.filter((s) => s.id !== id));
      message.success("Xóa thành công");
    } catch (err) {
      console.error(err);
      message.error("Xóa thất bại");
    }
  };

  // ===== Mở modal edit =====
  const openEdit = (record) => {
    // map backend -> form fields
    editForm.setFieldsValue({
      id: record.id,
      firstName: record.firstName || record.first_name || (record.name?.split(" ")?.slice(0, 1)?.join(" ") || ""),
      lastName: record.lastName || record.last_name || (record.name ? record.name.split(" ").slice(1).join(" ") : ""),
      email: record.email,
      phoneNumber: record.phoneNumber || record.phone || "",
      gender: record.gender || "Male",
      address: record.address || "",
      dateOfBirth: record.dateOfBirth ? dayjs(record.dateOfBirth) : null,
      roleId: record.roleId ?? null,
    });
    setEditingStaff(record);
    setEditOpen(true);
  };

  // ===== Lưu chỉnh sửa (PUT) =====
  const saveEdit = async (values) => {
    if (!editingStaff) return;
    const id = editingStaff.id;
    const body = {
      email: values.email,
      // password optional khi cập nhật - nếu backend bắt password khi tạo, để trống khi cập nhật
      firstName: values.firstName,
      lastName: values.lastName,
      phoneNumber: values.phoneNumber,
      gender: values.gender,
      address: values.address || "",
      dateOfBirth: values.dateOfBirth ? values.dateOfBirth.toISOString() : null,
      roleId: values.roleId ?? 3,
    };

    try {
      const res = await api.put(`/Admin/user/${id}`, body);
      message.success("Cập nhật nhân viên thành công");
      const updated = res.data || { id, ...body };
      setStaffs((prev) => prev.map((s) => (s.id === id ? updated : s)));
      setEditOpen(false);
      setEditingStaff(null);
      editForm.resetFields();
    } catch (err) {
      console.error(err);
      const detail = err?.response?.data?.message || err?.response?.data || err.message;
      message.error("Cập nhật thất bại: " + (detail || ""));
    }
  };

  const columns = [
    {
      title: "Ảnh",
      dataIndex: "photo",
      key: "photo",
      width: 90,
      fixed: "left",
      render: (src, record) => (
        <img
          src={src || record.imageUrl || "/img/useravt.jpg"}
          alt={record.firstName ? `${record.firstName} ${record.lastName || ""}` : record.name || "avatar"}
          style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", border: "1px solid #ddd" }}
          onError={(e) => (e.currentTarget.src = "/img/useravt.jpg")}
        />
      ),
    },
    {
      title: "Họ và tên",
      dataIndex: "name",
      key: "name",
      width: 220,
      render: (_, r) => {
        const first = r.firstName || "";
        const last = r.lastName || "";
        return (first || last) ? `${first} ${last}`.trim() : (r.name || "—");
      },
    },
    {
      title: "Giới tính",
      dataIndex: "gender",
      key: "gender",
      width: 120,
      render: (v) => (v === "Male" ? "Nam" : v === "Female" ? "Nữ" : "Khác"),
    },
    {
      title: "Ngày sinh",
      dataIndex: "dateOfBirth",
      key: "dateOfBirth",
      width: 140,
      render: (v) => (v ? dayjs(v).format("DD/MM/YYYY") : "—"),
    },
    {
      title: "SĐT",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
      width: 150,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 240,
    },
    {
      title: "Thao tác",
      key: "actions",
      fixed: "right",
      width: 160,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openEdit(record)}>Sửa</Button>
          <Button size="small" danger onClick={() => handleDelete(record.userId)}>Xóa</Button>
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
          <h2 className="mb-4 text-center">Quản lý nhân viên</h2>

          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h5 className="mb-3">Thêm nhân viên mới</h5>
              <Form
                form={addForm}
                layout="vertical"
                onFinish={handleAdd}
                initialValues={{ gender: "Male" }}
              >
                <div className="row g-3">
                  <div className="col-md-6">
                    <Form.Item name="lastName" rules={[{ required: true, message: "Nhập họ" }]}>
                      <Input placeholder="Họ" />
                    </Form.Item>
                  </div>
                  <div className="col-md-6">
                    <Form.Item name="firstName" rules={[{ required: true, message: "Nhập tên" }]}>
                      <Input placeholder="Tên " />
                    </Form.Item>
                  </div>
                  <div className="col-md-4">
                    <Form.Item name="email" rules={[{ required: true, type: "email", message: "Email không hợp lệ" }]}>
                      <Input placeholder="Email" />
                    </Form.Item>
                  </div>
                  {/* <div className="col-md-6">
                    <Form.Item name="password" rules={[{ required: true, min: 6, message: "Mật khẩu >= 6 ký tự" }]}>
                      <Input.Password placeholder="Mật khẩu" />
                    </Form.Item>
                  </div> */}
                  <div className="col-md-3">
                    <Form.Item name="phoneNumber" rules={[{ required: true, message: "Nhập số điện thoại" }]}>
                      <Input placeholder="Số điện thoại" />
                    </Form.Item>
                  </div>
                  <div className="col-md-3">
                    <Form.Item name="dateOfBirth">
                      <DatePicker style={{ width: "100%" }} placeholder="Ngày sinh" />
                    </Form.Item>
                  </div>
                  <div className="col-md-2">
                    <Form.Item name="gender">
                      <Select options={GENDER_OPTIONS} />
                    </Form.Item>
                  </div>
                  
                  <div className="col-md-12">
                    <Form.Item name="address">
                      <Input placeholder="Địa chỉ" />
                    </Form.Item>
                  </div>

                  <div className="col-md-4 d-flex align-items-end">
                    <Form.Item style={{ width: "100%", marginBottom: 0 }}>
                      <Button type="btn btn-add" htmlType="submit" block>
                        Thêm nhân viên
                      </Button>
                    </Form.Item>
                  </div>
                </div>
              </Form>
            </div>
          </div>

          {/* Table */}
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="mb-3">Danh sách nhân viên</h5>
              {loading ? (
                <div className="text-center py-5"><Spin /></div>
              ) : (
                <Table
                  rowKey={(r) => r.id}
                  columns={columns}
                  dataSource={staffs}
                  pagination={{ pageSize: 8 }}
                  scroll={{ x: "max-content" }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal edit */}
      <Modal
        title="Cập nhật nhân viên"
        open={editOpen}
        onCancel={() => { setEditOpen(false); setEditingStaff(null); editForm.resetFields(); }}
        onOk={() => editForm.submit()}
        okText="Lưu thay đổi"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={saveEdit}
        >
          <Form.Item name="firstName" label="Tên" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="lastName" label="Họ" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}>
            <Input />
          </Form.Item>

          <Form.Item name="phoneNumber" label="SĐT">
            <Input />
          </Form.Item>

          <Form.Item name="gender" label="Giới tính">
            <Select options={GENDER_OPTIONS} />
          </Form.Item>

          <Form.Item name="dateOfBirth" label="Ngày sinh">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="address" label="Địa chỉ">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
