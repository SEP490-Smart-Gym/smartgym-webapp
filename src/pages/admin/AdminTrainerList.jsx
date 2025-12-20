// AdminTrainerList.jsx
import React, { useEffect, useState } from "react";
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
  Switch,
} from "antd";
import api from "../../config/axios";
import dayjs from "dayjs";
import Sidebar from "../../components/Sidebar";

const GENDER_OPTIONS = [
  { label: "Nam", value: "Male" },
  { label: "Nữ", value: "Female" },
  { label: "Khác", value: "Other" },
];

const MIN_AGE = 18;

// Không cho chọn ngày sinh < 18 tuổi hoặc trong tương lai
const disabledBirthDate = (current) => {
  if (!current) return false;
  // lớn hơn hôm nay - 18 năm => dưới 18 tuổi => disable
  return current > dayjs().subtract(MIN_AGE, "year").endOf("day");
};

// Validator: nếu có chọn ngày thì phải >= 18 tuổi
const ageValidatorRule = {
  validator: (_, value) => {
    if (!value) return Promise.resolve(); // cho phép bỏ trống
    const age = dayjs().diff(value, "year");
    if (age < MIN_AGE) {
      return Promise.reject(
        new Error(`Huấn luyện viên phải ít nhất ${MIN_AGE} tuổi`)
      );
    }
    return Promise.resolve();
  },
};

/** ================== VALIDATORS ================== */

// trim check (không cho toàn khoảng trắng)
const requiredTrimRule = (msg) => ({
  required: true,
  validator: (_, v) => {
    const s = String(v ?? "").trim();
    if (!s) return Promise.reject(new Error(msg));
    return Promise.resolve();
  },
});

// tên: cho chữ + khoảng trắng + dấu tiếng Việt + ' - .
const nameFormatRule = (label = "Trường này") => ({
  validator: (_, v) => {
    if (v === undefined || v === null || String(v).trim() === "") return Promise.resolve();
    const s = String(v).trim();
    const ok = /^[A-Za-zÀ-ỹ\s.'-]+$/.test(s);
    if (!ok) return Promise.reject(new Error(`${label} chỉ nên chứa chữ cái và khoảng trắng.`));
    return Promise.resolve();
  },
});

const phoneVnRule = {
  validator: (_, v) => {
    const s = String(v ?? "").trim();
    if (!s) return Promise.reject(new Error("Vui lòng nhập số điện thoại."));
    // VN phổ biến: 0 + 9~10 số
    if (!/^0\d{9,10}$/.test(s)) {
      return Promise.reject(new Error("Số điện thoại không hợp lệ (VD: 0912345678)."));
    }
    return Promise.resolve();
  },
};

const emailRuleRequired = {
  required: true,
  type: "email",
  message: "Email không hợp lệ",
};

const optionalMinMaxTrimRule = (min, max, label) => ({
  validator: (_, v) => {
    if (v === undefined || v === null || String(v).trim() === "") return Promise.resolve();
    const s = String(v).trim();
    if (min != null && s.length < min) return Promise.reject(new Error(`${label} tối thiểu ${min} ký tự.`));
    if (max != null && s.length > max) return Promise.reject(new Error(`${label} tối đa ${max} ký tự.`));
    return Promise.resolve();
  },
});

const requiredMinMaxTrimRule = (min, max, label, requiredMsg) => ([
  requiredTrimRule(requiredMsg || `Vui lòng nhập ${label.toLowerCase()}.`),
  { min, message: `${label} tối thiểu ${min} ký tự.` },
  { max, message: `${label} tối đa ${max} ký tự.` },
]);

export default function AdminTrainerList() {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const generatePassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    return Array.from({ length: 10 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("");
  };

  //helper to normalize trainer data
  const normalizeTrainer = (u = {}) => {
    const firstName = u.firstName ?? "";
    const lastName = u.lastName ?? "";

    return {
      // ===== IDENTIFIER =====
      id: u.trainerId ?? null,

      // ===== NAME =====
      firstName,
      lastName,
      fullName:
        `${firstName}${firstName && lastName ? " " : ""}${lastName}`.trim() ||
        "—",

      // ===== IMAGE =====
      photo: u.imageUrl || "/img/useravt.jpg",

      // ===== BASIC INFO =====
      gender: u.gender ?? "Male",
      dateOfBirth: u.dateOfBirth ?? null,
      email: u.email ?? "—",
      phoneNumber: u.phoneNumber ?? "—",

      // ===== PROFESSIONAL INFO =====
      specialization: u.specialization ?? "—",
      trainerRating:
        typeof u.trainerRating === "number" ? u.trainerRating : null,
      totalReviews:
        typeof u.totalReviews === "number" ? u.totalReviews : 0,
      yearsOfExperience:
        typeof u.yearsOfExperience === "number"
          ? u.yearsOfExperience
          : null,
      workingShift: u.workingShift ?? null,

      // ===== STATUS =====
      isAvailableForNewClients: Boolean(u.isAvailableForNewClients),

      // ===== CERTIFICATES =====
      certificates: Array.isArray(u.certificates)
        ? u.certificates.map((c) => ({
            name: c.certificateName ?? "—",
            detail: c.certificateDetail ?? "—",
            // giữ fieldName gốc nếu cần edit lại
            certificateName: c.certificateName ?? "",
            certificateDetail: c.certificateDetail ?? "",
          }))
        : [],
    };
  };

  // Fetch trainers
  const fetchTrainers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/Admin/trainers");

      const raw = Array.isArray(res.data)
        ? res.data
        : res.data.items || res.data.data || [];

      const list = raw.map(normalizeTrainer);

      setTrainers(list);
    } catch (err) {
      console.error("fetch trainers error", err);
      message.error("Lấy danh sách huấn luyện viên thất bại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // CREATE trainer
  const handleAdd = async (values) => {
    const autoPassword = generatePassword();

    const body = {
      email: values.email,
      password: autoPassword,
      firstName: values.firstName || "",
      lastName: values.lastName || "",
      phoneNumber: values.phoneNumber || "",
      gender: values.gender || "Male",
      address: values.address || "",
      dateOfBirth: values.dateOfBirth
        ? dayjs(values.dateOfBirth).toISOString()
        : new Date().toISOString(),
      specialization: values.specialization || "",
      trainerBio: values.trainerBio || "",
      isAvailableForNewClients: !!values.isAvailableForNewClients,
      certificates:
        values.certificates && Array.isArray(values.certificates)
          ? values.certificates.map((c) => ({
              certificateName: c.certificateName || "",
              certificateDetail: c.certificateDetail || "",
            }))
          : [],
    };

    try {
      message.loading({
        content: "Đang tạo tài khoản...",
        key: "createTrainer",
      });
      await api.post("/Admin/create-trainer", body);

      Modal.success({
        title: "Tạo HLV thành công!",
        content: (
          <div>
            Mật khẩu đăng nhập:
            <br />
            <strong>{autoPassword}</strong>
          </div>
        ),
        getContainer: () => document.body,
      });

      addForm.resetFields();
      await fetchTrainers();
    } catch (err) {
      console.error("create trainer error", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        "Tạo HLV thất bại";
      message.error(Array.isArray(msg) ? msg.join(", ") : String(msg));
    } finally {
      message.destroy("createTrainer");
    }
  };

  // DELETE trainer
  const handleDelete = (record) => {
    Modal.confirm({
      title: "Xác nhận xoá Huấn luyện viên",
      content: (
        <>
          <p>
            Bạn có chắc chắn muốn xoá huấn luyện viên:
            <strong>
              {" "}
              {record.lastName} {record.firstName}
            </strong>
            ?
          </p>
        </>
      ),
      okText: "Xoá",
      okType: "danger",
      cancelText: "Huỷ",
      async onOk() {
        try {
          const id = record?.id || record?.raw?.userId;

          if (!id) {
            // fallback local
            setTrainers((prev) => prev.filter((t) => t !== record));
            message.success("Đã xoá (local)");
            return;
          }

          // call API
          try {
            await api.delete(`/Admin/user/${id}`);
          } catch {
            // fallback nếu backend map khác
            await api.delete(`/Admin/trainer/${id}`);
          }

          message.success("Xoá huấn luyện viên thành công");
          await fetchTrainers();
        } catch (err) {
          console.error("delete trainer error", err);
          message.error("Xoá huấn luyện viên thất bại");
        }
      },
    });
  };

  // OPEN edit modal
  const openEdit = (record) => {
    setEditing(record);
    editForm.setFieldsValue({
      firstName: record.firstName,
      lastName: record.lastName,
      email: record.email,
      phoneNumber: record.phoneNumber,
      gender: record.gender || "Male",
      address: record.address,
      dateOfBirth: record.dateOfBirth ? dayjs(record.dateOfBirth) : null,
      specialization: record.specialization,
      trainerBio: record.trainerBio,
      isAvailableForNewClients: record.isAvailableForNewClients,
      certificates:
        record.certificates && record.certificates.length
          ? record.certificates.map((c) => ({
              certificateName: c.certificateName ?? c.name ?? "",
              certificateDetail: c.certificateDetail ?? c.detail ?? "",
            }))
          : [{ certificateName: "", certificateDetail: "" }],
    });
    setEditOpen(true);
  };

  const saveEdit = async (values) => {
    if (!editing) return;
    const id = editing.id || editing.raw?.userId;
    const body = {
      email: values.email,
      firstName: values.firstName,
      lastName: values.lastName,
      phoneNumber: values.phoneNumber,
      gender: values.gender,
      address: values.address,
      dateOfBirth: values.dateOfBirth
        ? dayjs(values.dateOfBirth).toISOString()
        : null,
      specialization: values.specialization,
      trainerBio: values.trainerBio,
      isAvailableForNewClients: !!values.isAvailableForNewClients,
      certificates: (values.certificates || []).map((c) => ({
        certificateName: c.certificateName || "",
        certificateDetail: c.certificateDetail || "",
      })),
      // salary giữ như bạn đang có field (nếu backend nhận)
      salary: values.salary,
    };

    try {
      try {
        await api.put(`/Admin/trainer/${id}`, body);
      } catch (err) {
        await api.put(`/Admin/user/${id}`, body);
      }

      message.success("Cập nhật thành công");
      setEditOpen(false);
      setEditing(null);
      editForm.resetFields();
      await fetchTrainers();
    } catch (err) {
      console.error("update trainer error", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        "Cập nhật thất bại";
      message.error(Array.isArray(msg) ? msg.join(", ") : String(msg));
    }
  };

  const viewCertificates = (record) => {
    if (!record.certificates || record.certificates.length === 0) {
      return Modal.info({
        title: "Chứng chỉ",
        content: "Huấn luyện viên này chưa có chứng chỉ nào.",
        okText: "Đóng",
        getContainer: () => document.body,
      });
    }

    Modal.info({
      title: "Danh sách chứng chỉ",
      width: 600,
      content: (
        <div>
          {record.certificates.map((c, idx) => (
            <div key={idx} style={{ marginBottom: 12 }}>
              <strong>{c.certificateName ?? c.name}</strong>
              <br />
              <span>{c.certificateDetail ?? c.detail}</span>
              <hr />
            </div>
          ))}
        </div>
      ),
      okText: "Đóng",
      getContainer: () => document.body,
    });
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
          alt={r.name || "avatar"}
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
    { title: "Email", dataIndex: "email", key: "email", width: 220 },
    { title: "SĐT", dataIndex: "phoneNumber", key: "phoneNumber", width: 140 },
    {
      title: "Chuyên môn",
      dataIndex: "specialization",
      key: "specialization",
      width: 200,
    },
    {
      title: "Sẵn sàng nhận khách mới",
      dataIndex: "isAvailableForNewClients",
      key: "isAvailableForNewClients",
      width: 160,
      render: (v) => (v ? "Có" : "Không"),
    },
    {
      title: "Chứng chỉ",
      dataIndex: "certificates",
      key: "certificates",
      width: 120,
      render: (_, record) => (
        <Button size="small" type="link" onClick={() => viewCertificates(record)}>
          Xem
        </Button>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      fixed: "right",
      width: 180,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openEdit(record)}>
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
          <Sidebar role="Admin" />
        </div>

        <div className="col-lg-9">
          <h2 className="mb-4 text-center">Quản lý Huấn luyện viên</h2>

          {/* Form thêm */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h5 className="mb-3">Thêm HLV mới</h5>

              <Form
                form={addForm}
                layout="vertical"
                onFinish={handleAdd}
                initialValues={{
                  gender: "Male",
                  salary: 0,
                  isAvailableForNewClients: true,
                  certificates: [{ certificateName: "", certificateDetail: "" }],
                }}
              >
                <div className="row g-3">
                  <div className="col-md-6">
                    <Form.Item
                      name="lastName"
                      rules={[
                        ...requiredMinMaxTrimRule(1, 30, "Họ", "Nhập họ"),
                        nameFormatRule("Họ"),
                      ]}
                    >
                      <Input placeholder="Họ" maxLength={30} />
                    </Form.Item>
                  </div>

                  <div className="col-md-6">
                    <Form.Item
                      name="firstName"
                      rules={[
                        ...requiredMinMaxTrimRule(1, 30, "Tên", "Nhập tên"),
                        nameFormatRule("Tên"),
                      ]}
                    >
                      <Input placeholder="Tên" maxLength={30} />
                    </Form.Item>
                  </div>

                  <div className="col-md-6">
                    <Form.Item
                      name="email"
                      rules={[
                        emailRuleRequired,
                        { max: 120, message: "Email tối đa 120 ký tự." },
                      ]}
                    >
                      <Input placeholder="Email" maxLength={120} />
                    </Form.Item>
                  </div>

                  <div className="col-md-6">
                    <Form.Item name="phoneNumber" rules={[phoneVnRule]}>
                      <Input placeholder="Số điện thoại" maxLength={11} />
                    </Form.Item>
                  </div>

                  <div className="col-md-4">
                    <Form.Item
                      name="gender"
                      rules={[{ required: true, message: "Vui lòng chọn giới tính" }]}
                    >
                      <Select options={GENDER_OPTIONS} />
                    </Form.Item>
                  </div>

                  <div className="col-md-4">
                    <Form.Item name="dateOfBirth" rules={[ageValidatorRule]}>
                      <DatePicker
                        style={{ width: "100%" }}
                        placeholder="Ngày sinh"
                        disabledDate={disabledBirthDate}
                        // mở panel sẵn ở năm (today - 18)
                        defaultPickerValue={dayjs().subtract(MIN_AGE, "year")}
                      />
                    </Form.Item>
                  </div>

                  <div className="col-md-12">
                    <Form.Item
                      name="address"
                      rules={[optionalMinMaxTrimRule(3, 255, "Địa chỉ")]}
                    >
                      <Input placeholder="Địa chỉ" maxLength={255} />
                    </Form.Item>
                  </div>

                  <div className="col-md-6">
                    <Form.Item
                      name="specialization"
                      rules={[
                        requiredTrimRule("Vui lòng nhập chuyên môn."),
                        { min: 2, message: "Chuyên môn tối thiểu 2 ký tự." },
                        { max: 100, message: "Chuyên môn tối đa 100 ký tự." },
                      ]}
                    >
                      <Input placeholder="Chuyên môn" maxLength={100} />
                    </Form.Item>
                  </div>

                  <div className="col-md-6">
                    <Form.Item
                      name="isAvailableForNewClients"
                      label="Sẵn sàng nhận khách mới"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </div>

                  <div className="col-md-12">
                    <Form.Item
                      name="trainerBio"
                      rules={[optionalMinMaxTrimRule(0, 1000, "Mô tả")]}
                    >
                      <Input.TextArea
                        placeholder="Mô tả / giới thiệu"
                        rows={3}
                        maxLength={1000}
                        showCount
                      />
                    </Form.Item>
                  </div>

                  {/* Certificates */}
                  <div className="col-md-12">
                    <Form.List name="certificates">
                      {(fields, { add, remove }) => (
                        <div>
                          <label className="form-label">Certificates</label>
                          {fields.map((field) => (
                            <Space
                              key={field.key}
                              align="start"
                              style={{
                                display: "flex",
                                marginBottom: 8,
                              }}
                            >
                              <Form.Item
                                {...field}
                                name={[field.name, "certificateName"]}
                                fieldKey={[field.fieldKey, "certificateName"]}
                                rules={[
                                  requiredTrimRule("Tên chứng chỉ bắt buộc."),
                                  { min: 2, message: "Tên chứng chỉ tối thiểu 2 ký tự." },
                                  { max: 100, message: "Tên chứng chỉ tối đa 100 ký tự." },
                                ]}
                              >
                                <Input placeholder="Tên chứng chỉ" maxLength={100} />
                              </Form.Item>

                              <Form.Item
                                {...field}
                                name={[field.name, "certificateDetail"]}
                                fieldKey={[field.fieldKey, "certificateDetail"]}
                                rules={[
                                  requiredTrimRule("Chi tiết chứng chỉ bắt buộc."),
                                  { min: 2, message: "Chi tiết tối thiểu 2 ký tự." },
                                  { max: 255, message: "Chi tiết tối đa 255 ký tự." },
                                ]}
                              >
                                <Input placeholder="Chi tiết" maxLength={255} />
                              </Form.Item>

                              <Button danger onClick={() => remove(field.name)}>
                                Xóa
                              </Button>
                            </Space>
                          ))}

                          <Form.Item>
                            <Button type="dashed" onClick={() => add()} block>
                              Thêm chứng chỉ
                            </Button>
                          </Form.Item>
                        </div>
                      )}
                    </Form.List>
                  </div>

                  <div className="col-md-12 text-end">
                    <Form.Item style={{ marginBottom: 0 }}>
                      <Button type="btn btn-add" htmlType="submit">
                        Tạo HLV
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
              <h5 className="mb-3">Danh sách HLV</h5>
              {loading ? (
                <div className="text-center py-5">
                  <Spin />
                </div>
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

      {/* Edit Modal */}
      <Modal
        title="Cập nhật HLV"
        open={editOpen}
        onCancel={() => {
          setEditOpen(false);
          setEditing(null);
          editForm.resetFields();
        }}
        onOk={() => editForm.submit()}
        okText="Lưu thay đổi"
        cancelText="Huỷ"
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" onFinish={saveEdit} preserve={false}>
          <Form.Item
            name="firstName"
            label="Tên"
            rules={[
              ...requiredMinMaxTrimRule(1, 30, "Tên", "Vui lòng nhập tên."),
              nameFormatRule("Tên"),
            ]}
          >
            <Input maxLength={30} />
          </Form.Item>

          <Form.Item
            name="lastName"
            label="Họ"
            rules={[
              ...requiredMinMaxTrimRule(1, 30, "Họ", "Vui lòng nhập họ."),
              nameFormatRule("Họ"),
            ]}
          >
            <Input maxLength={30} />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { type: "email", message: "Email không hợp lệ" },
              { max: 120, message: "Email tối đa 120 ký tự." },
            ]}
          >
            <Input maxLength={120} />
          </Form.Item>

          <Form.Item name="phoneNumber" label="SĐT" rules={[phoneVnRule]}>
            <Input maxLength={11} />
          </Form.Item>

          <Form.Item
            name="gender"
            label="Giới tính"
            rules={[{ required: true, message: "Vui lòng chọn giới tính" }]}
          >
            <Select options={GENDER_OPTIONS} />
          </Form.Item>

          <Form.Item name="dateOfBirth" label="Ngày sinh" rules={[ageValidatorRule]}>
            <DatePicker
              style={{ width: "100%" }}
              disabledDate={disabledBirthDate}
              defaultPickerValue={dayjs().subtract(MIN_AGE, "year")}
            />
          </Form.Item>

          <Form.Item
            name="specialization"
            label="Chuyên môn"
            rules={[
              requiredTrimRule("Vui lòng nhập chuyên môn."),
              { min: 2, message: "Chuyên môn tối thiểu 2 ký tự." },
              { max: 100, message: "Chuyên môn tối đa 100 ký tự." },
            ]}
          >
            <Input maxLength={100} />
          </Form.Item>

          <Form.Item
            name="trainerBio"
            label="Mô tả"
            rules={[optionalMinMaxTrimRule(0, 1000, "Mô tả")]}
          >
            <Input.TextArea rows={3} maxLength={1000} showCount />
          </Form.Item>

          <Form.Item
            name="salary"
            label="Lương"
            rules={[
              {
                validator: (_, v) => {
                  if (v === undefined || v === null || v === "") return Promise.resolve();
                  const n = Number(v);
                  if (Number.isNaN(n)) return Promise.reject(new Error("Lương không hợp lệ."));
                  if (n < 0) return Promise.reject(new Error("Lương phải >= 0."));
                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>

          <Form.Item
            name="isAvailableForNewClients"
            label="Sẵn sàng nhận khách mới"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.List name="certificates">
            {(fields, { add, remove }) => (
              <div>
                {fields.map((field) => (
                  <Space key={field.key} align="start" style={{ display: "flex", marginBottom: 8 }}>
                    <Form.Item
                      {...field}
                      name={[field.name, "certificateName"]}
                      fieldKey={[field.fieldKey, "certificateName"]}
                      rules={[
                        requiredTrimRule("Tên chứng chỉ bắt buộc."),
                        { min: 2, message: "Tên chứng chỉ tối thiểu 2 ký tự." },
                        { max: 100, message: "Tên chứng chỉ tối đa 100 ký tự." },
                      ]}
                    >
                      <Input placeholder="Tên chứng chỉ" maxLength={100} />
                    </Form.Item>

                    <Form.Item
                      {...field}
                      name={[field.name, "certificateDetail"]}
                      fieldKey={[field.fieldKey, "certificateDetail"]}
                      rules={[
                        requiredTrimRule("Chi tiết chứng chỉ bắt buộc."),
                        { min: 2, message: "Chi tiết tối thiểu 2 ký tự." },
                        { max: 255, message: "Chi tiết tối đa 255 ký tự." },
                      ]}
                    >
                      <Input placeholder="Chi tiết" maxLength={255} />
                    </Form.Item>

                    <Button danger onClick={() => remove(field.name)}>
                      Xóa
                    </Button>
                  </Space>
                ))}

                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block>
                    Thêm chứng chỉ
                  </Button>
                </Form.Item>
              </div>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
}
