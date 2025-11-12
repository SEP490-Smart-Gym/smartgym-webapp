import { useEffect, useState } from "react";
import { Table, Button, Space, Modal, Form, Input, InputNumber, DatePicker, Select, message } from "antd";
import dayjs from "dayjs";
import api from "../../config/axios";
import AdminSidebar from "../../components/AdminSidebar";

const { RangePicker } = DatePicker;

const DISCOUNT_TYPES = [
  { label: "%", value: "Percentage" },
  { label: "Số tiền", value: "Fixed" },
];

export default function AdminVoucher() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  // form cho thêm (xuất hiện cố định trên trang)
  const [formAdd] = Form.useForm();

  // modal sửa
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formEdit] = Form.useForm();

  // lấy danh sách
  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await api.get("/discountcode"); // GET /api/discountcode
      // tùy API: có thể res.data là mảng hoặc wrapper
      const data = Array.isArray(res.data) ? res.data : res.data?.items ?? res.data;
      setList(data || []);
    } catch (err) {
      console.error(err);
      message.error("Không tải được danh sách voucher.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  // ===== Thêm mới =====
  const handleAdd = async (values) => {
    try {
      // chuyển dates sang ISO
      const payload = {
        code: values.code.trim().toUpperCase(),
        description: values.description || "",
        discountType: values.discountType,
        discountValue: Number(values.discountValue),
        maxDiscountAmount: values.maxDiscountAmount ? Number(values.maxDiscountAmount) : undefined,
        minimumPurchaseAmount: values.minimumPurchaseAmount ? Number(values.minimumPurchaseAmount) : undefined,
        usageLimit: values.usageLimit ? Number(values.usageLimit) : undefined,
        validFrom: values.validRange && values.validRange[0] ? values.validRange[0].toISOString() : undefined,
        validUntil: values.validRange && values.validRange[1] ? values.validRange[1].toISOString() : undefined,
      };

      // Xác nhận validate extra: validFrom < validUntil
      if (payload.validFrom && payload.validUntil && payload.validFrom >= payload.validUntil) {
        return message.error("Ngày bắt đầu phải sớm hơn ngày kết thúc.");
      }

      await api.post("/discountcode", payload);
      message.success("Tạo voucher thành công.");
      formAdd.resetFields();
      fetchList();
    } catch (err) {
      console.error(err);
      // hiển thị lỗi server nếu có
      const msg = err?.response?.data?.message || "Tạo voucher thất bại.";
      message.error(msg);
    }
  };

  // ===== Mở modal sửa =====
  const openEdit = (record) => {
    setEditing(record);
    // populate formEdit with server fields
    formEdit.setFieldsValue({
      code: record.code,
      description: record.description,
      discountType: record.discountType,
      discountValue: record.discountValue,
      maxDiscountAmount: record.maxDiscountAmount,
      minimumPurchaseAmount: record.minimumPurchaseAmount,
      usageLimit: record.usageLimit,
      validRange:
        record.validFrom || record.validUntil
          ? [record.validFrom ? dayjs(record.validFrom) : null, record.validUntil ? dayjs(record.validUntil) : null]
          : null,
      isActive: record.isActive,
    });
    setIsEditOpen(true);
  };

  // ===== Lưu sửa =====
  const handleEditSave = async () => {
    try {
      const values = await formEdit.validateFields();
      const payload = {
        code: values.code.trim(),
        description: values.description || "",
        discountType: values.discountType,
        discountValue: Number(values.discountValue),
        maxDiscountAmount: values.maxDiscountAmount ? Number(values.maxDiscountAmount) : undefined,
        minimumPurchaseAmount: values.minimumPurchaseAmount ? Number(values.minimumPurchaseAmount) : undefined,
        usageLimit: values.usageLimit ? Number(values.usageLimit) : undefined,
        validFrom: values.validRange && values.validRange[0] ? values.validRange[0].toISOString() : undefined,
        validUntil: values.validRange && values.validRange[1] ? values.validRange[1].toISOString() : undefined,
        isActive: values.isActive ?? true,
      };

      if (payload.validFrom && payload.validUntil && payload.validFrom >= payload.validUntil) {
        return message.error("Ngày bắt đầu phải sớm hơn ngày kết thúc.");
      }

      // giả sử endpoint update là PUT /discountcode/{id}
      await api.put(`/discountcode/${editing.id}`, payload);
      message.success("Cập nhật voucher thành công.");
      setIsEditOpen(false);
      setEditing(null);
      fetchList();
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || "Cập nhật thất bại.";
      message.error(msg);
    }
  };

  // ===== Xóa =====
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa voucher này?")) return;
    try {
      await api.delete(`/discountcode/${id}`);
      message.success("Xóa thành công.");
      fetchList();
    } catch (err) {
      console.error(err);
      message.error("Xóa thất bại.");
    }
  };

  // ===== Bảng =====
  const columns = [
    { title: "Mã", dataIndex: "code", key: "code", width: 220 },
    { title: "Mô tả", dataIndex: "description", key: "description", ellipsis: true },
    { title: "Loại", dataIndex: "discountType", key: "discountType", width: 140 },
    { title: "Giá trị", dataIndex: "discountValue", key: "discountValue", width: 120, render: (v, r) => `${v}${r.discountType === "Percentage" ? "%" : " đ"}` },
    { title: "Giới hạn (max)", dataIndex: "maxDiscountAmount", key: "maxDiscountAmount", width: 140, render: (v) => (v ? `${Number(v).toLocaleString()} đ` : "—") },
    { title: "Tối thiểu đơn", dataIndex: "minimumPurchaseAmount", key: "minimumPurchaseAmount", width: 140, render: (v) => (v ? `${Number(v).toLocaleString()} đ` : "—") },
    { title: "Số lượng", dataIndex: "usageLimit", key: "usageLimit", width: 110 },
    {
      title: "Thời hạn",
      key: "valid",
      width: 240,
      render: (_, r) =>
        r.validFrom && r.validUntil
          ? `${dayjs(r.validFrom).format("DD/MM/YYYY")} → ${dayjs(r.validUntil).format("DD/MM/YYYY")}`
          : "—",
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      width: 120,
      render: (v) => (v ? <span style={{ color: "green" }}>Active</span> : <span style={{ color: "gray" }}>Inactive</span>),
    },
    {
      title: "Hành động",
      key: "actions",
      width: 200,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openEdit(record)}>
            Sửa
          </Button>
          <Button size="small" danger onClick={() => handleDelete(record.id)}>
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
          <h2 className="mb-4 text-center">Quản lý Voucher</h2>

          {/* Form thêm (cố định) */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h5 className="mb-3">Tạo Voucher mới</h5>

              <Form layout="vertical" form={formAdd} onFinish={handleAdd} initialValues={{ discountType: "Percentage" }}>
                <div className="row g-3">
                  <div className="col-md-4">
                    <Form.Item name="code" label="Mã voucher" rules={[{ required: true, message: "Nhập mã voucher" }]}>
                      <Input placeholder="VD: PROMO2025" />
                    </Form.Item>
                  </div>

                  <div className="col-md-4">
                    <Form.Item name="discountType" label="Loại giảm giá" rules={[{ required: true }]}>
                      <Select options={DISCOUNT_TYPES} />
                    </Form.Item>
                  </div>

                  <div className="col-md-4">
                    <Form.Item name="discountValue" label="Giá trị" rules={[{ required: true, message: "Nhập giá trị" }]}>
                      <InputNumber className="w-100" min={0} />
                    </Form.Item>
                  </div>

                  <div className="col-md-4">
                    <Form.Item name="maxDiscountAmount" label="Giá trị tối đa (nếu có)">
                      <InputNumber className="w-100" min={0} />
                    </Form.Item>
                  </div>

                  <div className="col-md-4">
                    <Form.Item name="minimumPurchaseAmount" label="Tối thiểu đơn (nếu có)">
                      <InputNumber className="w-100" min={0} />
                    </Form.Item>
                  </div>

                  <div className="col-md-4">
                    <Form.Item name="usageLimit" label="Số lượng (usageLimit)">
                      <InputNumber className="w-100" min={0} />
                    </Form.Item>
                  </div>

                  <div className="col-md-6">
                    <Form.Item name="validRange" label="Thời gian (bắt đầu → kết thúc)">
                      <RangePicker showTime format="DD/MM/YYYY HH:mm" className="w-100" />
                    </Form.Item>
                  </div>

                  <div className="col-md-6">
                    <Form.Item name="description" label="Mô tả">
                      <Input placeholder="Mô tả ngắn" />
                    </Form.Item>
                  </div>
                </div>

                <div className="text-end">
                  <Button type="primary" htmlType="submit">
                    Tạo voucher
                  </Button>
                </div>
              </Form>
            </div>
          </div>

          {/* Bảng voucher */}
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="mb-3">Danh sách Voucher</h5>
              <Table
                rowKey={(r) => r.id ?? r.code}
                dataSource={list}
                columns={columns}
                loading={loading}
                pagination={{ pageSize: 8 }}
                scroll={{ x: "max-content" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal edit */}
      <Modal
        title="Cập nhật Voucher"
        open={isEditOpen}
        onCancel={() => {
          setIsEditOpen(false);
          setEditing(null);
        }}
        onOk={handleEditSave}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form layout="vertical" form={formEdit}>
          <Form.Item name="code" label="Mã voucher" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="discountType" label="Loại giảm giá" rules={[{ required: true }]}>
            <Select options={DISCOUNT_TYPES} />
          </Form.Item>

          <Form.Item name="discountValue" label="Giá trị" rules={[{ required: true }]}>
            <InputNumber className="w-100" min={0} />
          </Form.Item>

          <Form.Item name="maxDiscountAmount" label="Giá trị tối đa">
            <InputNumber className="w-100" min={0} />
          </Form.Item>

          <Form.Item name="minimumPurchaseAmount" label="Tối thiểu đơn">
            <InputNumber className="w-100" min={0} />
          </Form.Item>

          <Form.Item name="usageLimit" label="Số lượng (usageLimit)">
            <InputNumber className="w-100" min={0} />
          </Form.Item>

          <Form.Item name="validRange" label="Thời gian (bắt đầu → kết thúc)">
            <RangePicker showTime format="DD/MM/YYYY HH:mm" className="w-100" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <Input />
          </Form.Item>

          <Form.Item name="isActive" label="Hoạt động">
            <Select options={[{ label: "Active", value: true }, { label: "Inactive", value: false }]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
