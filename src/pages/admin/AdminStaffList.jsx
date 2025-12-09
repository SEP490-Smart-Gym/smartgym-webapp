import { useEffect, useState } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import {
  Table,
  Space,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  message,
  Spin,
} from "antd";
import api from "../../config/axios";
import dayjs from "dayjs";

const GENDER_OPTIONS = [
  { label: "Nam", value: "Male" },
  { label: "Nữ", value: "Female" },
  { label: "Khác", value: "Other" },
];

const MIN_AGE = 18;

// ❌ Không cho chọn ngày sinh nhỏ hơn 18 tuổi (và ngày trong tương lai)
const disabledBirthDate = (current) => {
  if (!current) return false;
  // lớn hơn hôm nay - 18 năm => dưới 18 tuổi => disable
  return current > dayjs().subtract(MIN_AGE, "year").endOf("day");
};

// ✅ Validator cho Form: nếu có chọn ngày thì phải ≥ 18 tuổi
const ageValidatorRule = {
  validator: (_, value) => {
    if (!value) {
      // cho phép bỏ trống; nếu muốn bắt buộc nhập thì thêm rule required riêng
      return Promise.resolve();
    }
    const age = dayjs().diff(value, "year");
    if (age < MIN_AGE) {
      return Promise.reject(
        new Error(`Nhân viên phải ít nhất ${MIN_AGE} tuổi`)
      );
    }
    return Promise.resolve();
  },
};

export default function AdminStaffList() {
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(false);

  // form add (antd)
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
      // map/normalize nếu cần (giữ nguyên filter theo roleId nếu backend dùng)
      const staffList = Array.isArray(data)
        ? data
            .filter((u) => {
              if (!u) return false;
              if (u.roleName && typeof u.roleName === "string")
                return u.roleName.toLowerCase() === "staff";
              if (u.roleId) return Number(u.roleId) === 3;
              return false;
            })
            .map((u) => ({
              id: u.userId ?? u.id,
              ...u,
            }))
        : [];
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
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    return Array.from({ length: 10 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("");
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
      dateOfBirth: values.dateOfBirth
        ? dayjs(values.dateOfBirth).toISOString()
        : new Date().toISOString(),
      roleId: 3, // staff
    };

    try {
      await api.post("/Admin/create-user", body);

      Modal.success({
        title: "Tạo nhân viên thành công!",
        content: (
          <div>
            Mật khẩu đăng nhập:
            <br />
            <strong>{autoPassword}</strong>
          </div>
        ),
        getContainer: () => document.body,
      });

      await fetchStaffs();

      addForm.resetFields();
    } catch (err) {
      const detail =
        err?.response?.data?.message || err?.response?.data || err.message;
      message.error("Tạo nhân viên thất bại: " + (detail || ""));
    }
  };

  // ===== Xóa (DELETE) =====
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa nhân viên này?")) return;
    try {
      await api.delete(`/Admin/user/${id}`);

      // LẤY LẠI DỮ LIỆU TỪ SERVER để table đồng bộ
      await fetchStaffs();

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
      firstName:
        record.firstName ||
        record.first_name ||
        record.name?.split(" ")?.slice(0, 1)?.join(" ") ||
        "",
      lastName:
        record.lastName ||
        record.last_name ||
        (record.name ? record.name.split(" ").slice(1).join(" ") : ""),
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
      dateOfBirth: values.dateOfBirth
        ? values.dateOfBirth.toISOString()
        : null,
      roleId: values.roleId ?? 3,
    };

    try {
      const res = await api.put(`/Admin/user/${id}`, body);
      message.success("Cập nhật nhân viên thành công");
      const updated = res.data || { id, ...body };

      // cập nhật local nhanh và/hoặc fetch lại cho chắc chắn
      setStaffs((prev) => prev.map((s) => (s.id === id ? updated : s)));

      // Nếu muốn chắc chắn khớp server -> uncomment dòng dưới
      // await fetchStaffs();

      setEditOpen(false);
      setEditingStaff(null);
      editForm.resetFields();
    } catch (err) {
      console.error(err);
      const detail =
        err?.response?.data?.message || err?.response?.data || err.message;
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
          alt={
            record.firstName
              ? `${record.firstName} ${record.lastName || ""}`
              : record.name || "avatar"
          }
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            objectFit: "cover",
            border: "1px solid #ddd",
          }}
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
        return first || last ? `${last} ${first}`.trim() : r.name || "—";
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
          <Button size="small" onClick={() => openEdit(record)}>
            Sửa
          </Button>
          <Button
            size="small"
            danger
            onClick={() => handleDelete(record.id)}
          >
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
                    <Form.Item
                      name="lastName"
                      rules={[{ required: true, message: "Nhập họ" }]}
                    >
                      <Input placeholder="Họ" />
                    </Form.Item>
                  </div>
                  <div className="col-md-6">
                    <Form.Item
                      name="firstName"
                      rules={[{ required: true, message: "Nhập tên" }]}
                    >
                      <Input placeholder="Tên " />
                    </Form.Item>
                  </div>
                  <div className="col-md-4">
                    <Form.Item
                      name="email"
                      rules={[
                        {
                          required: true,
                          type: "email",
                          message: "Email không hợp lệ",
                        },
                      ]}
                    >
                      <Input placeholder="Email" />
                    </Form.Item>
                  </div>
                  <div className="col-md-3">
                    <Form.Item
                      name="phoneNumber"
                      rules={[{ required: true, message: "Nhập số điện thoại" }]}
                    >
                      <Input placeholder="Số điện thoại" />
                    </Form.Item>
                  </div>
                  <div className="col-md-3">
                    <Form.Item
                      name="dateOfBirth"
                      rules={[ageValidatorRule]}
                    >
                      <DatePicker
                        style={{ width: "100%" }}
                        placeholder="Ngày sinh"
                        disabledDate={disabledBirthDate}
                        // 👇 Khi mở lịch, nhảy sẵn về năm (hôm nay - 18)
                        defaultPickerValue={dayjs().subtract(MIN_AGE, "year")}
                      />
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
                      <Button className="btn btn-add" htmlType="submit" block>
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
                <div className="text-center py-5">
                  <Spin />
                </div>
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
        onCancel={() => {
          setEditOpen(false);
          setEditingStaff(null);
          editForm.resetFields();
        }}
        onOk={() => editForm.submit()}
        okText="Lưu thay đổi"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" onFinish={saveEdit}>
          <Form.Item
            name="firstName"
            label="Tên"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="lastName"
            label="Họ"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: "email" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="phoneNumber" label="SĐT">
            <Input />
          </Form.Item>

          <Form.Item name="gender" label="Giới tính">
            <Select options={GENDER_OPTIONS} />
          </Form.Item>

          <Form.Item
            name="dateOfBirth"
            label="Ngày sinh"
            rules={[ageValidatorRule]}
          >
            <DatePicker
              style={{ width: "100%" }}
              disabledDate={disabledBirthDate}
              // 👇 Nếu chưa có DOB thì panel cũng mở ở năm (hôm nay - 18)
              defaultPickerValue={dayjs().subtract(MIN_AGE, "year")}
            />
          </Form.Item>

          <Form.Item name="address" label="Địa chỉ">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
