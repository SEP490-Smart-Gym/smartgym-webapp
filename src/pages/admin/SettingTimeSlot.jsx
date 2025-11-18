// AdminStaffList.jsx (quản lý Time Slot)
import { useEffect, useState } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import { Table, Space, Button, Modal, Form, Input, message, Spin } from "antd";
import api from "../../config/axios";

// Chuẩn hóa giờ về dạng HH:mm:ss để backend TimeOnly parse được
const normalizeTime = (val) => {
  if (!val) return null;
  const t = String(val).trim();
  // match: H:MM, HH:MM, H:MM:SS, HH:MM:SS
  const match = t.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return t; // nếu user nhập lạ thì gửi nguyên, backend báo lỗi rõ
  let h = match[1].padStart(2, "0");
  let m = match[2];
  let s = match[3] || "00";
  return `${h}:${m}:${s}`;
};

export default function AdminStaffList() {
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  // form add (không modal)
  const [addForm] = Form.useForm();

  // edit modal
  const [editForm] = Form.useForm();
  const [editingSlot, setEditingSlot] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  // ===== Fetch danh sách TimeSlot =====
  const fetchTimeSlots = async () => {
    setLoading(true);
    try {
      const res = await api.get("/TimeSlot");
      const data = Array.isArray(res.data) ? res.data : res.data.items || [];
      setTimeSlots(data);
    } catch (err) {
      console.error("GET /TimeSlot error:", err.response?.data || err);
      message.error("Lấy danh sách ca tập thất bại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeSlots();
  }, []);

  // ===== Thêm TimeSlot (POST) =====
  const handleAdd = async (values) => {
    const startTime = normalizeTime(values.startTime);
    const endTime = normalizeTime(values.endTime);

    const body = {
      slotName: values.slotName,
      startTime,
      endTime,
    };

    try {
      const res = await api.post("/TimeSlot", body);
      const created = res.data || body;

      setTimeSlots((prev) => [created, ...prev]);
      message.success("Tạo ca tập thành công!");
      addForm.resetFields();
    } catch (err) {
      console.error("POST /TimeSlot error:", err.response?.data || err);
      const detail =
        err?.response?.data?.title ||
        err?.response?.data?.message ||
        JSON.stringify(err?.response?.data) ||
        err.message;
      message.error("Tạo ca tập thất bại: " + (detail || ""));
    }
  };

  // ===== Xóa TimeSlot (DELETE) =====
  const handleDelete = async (record) => {
    const id = record.id ?? record.timeSlotId;
    if (!id) {
      message.error("Không tìm được ID ca tập để xóa");
      return;
    }

    if (!window.confirm("Bạn có chắc muốn xóa ca tập này?")) return;

    try {
      await api.delete(`/TimeSlot/${id}`);
      setTimeSlots((prev) =>
        prev.filter((s) => (s.id ?? s.timeSlotId) !== id)
      );
      message.success("Xóa ca tập thành công");
    } catch (err) {
      console.error("DELETE /TimeSlot error:", err.response?.data || err);
      message.error("Xóa ca tập thất bại");
    }
  };

  // ===== Mở modal edit =====
  const openEdit = (record) => {
    const trimTime = (t) => {
      if (!t) return "";
      const match = String(t).match(/^(\d{2}:\d{2})/);
      return match ? match[1] : t;
    };

    editForm.setFieldsValue({
      slotName: record.slotName || "",
      startTime: trimTime(record.startTime),
      endTime: trimTime(record.endTime),
    });
    setEditingSlot(record);
    setEditOpen(true);
  };

  // ===== Lưu chỉnh sửa (PUT) =====
  const saveEdit = async (values) => {
    if (!editingSlot) return;
    const id = editingSlot.id ?? editingSlot.timeSlotId;
    if (!id) {
      message.error("Không tìm được ID ca tập để cập nhật");
      return;
    }

    const startTime = normalizeTime(values.startTime);
    const endTime = normalizeTime(values.endTime);

    const body = {
      slotName: values.slotName,
      startTime,
      endTime,
    };

    try {
      const res = await api.put(`/TimeSlot/${id}`, body);
      message.success("Cập nhật ca tập thành công");

      const updated = res.data || { ...editingSlot, ...body };
      setTimeSlots((prev) =>
        prev.map((s) =>
          (s.id ?? s.timeSlotId) === id ? updated : s
        )
      );

      setEditOpen(false);
      setEditingSlot(null);
      editForm.resetFields();
    } catch (err) {
      console.error("PUT /TimeSlot error:", err.response?.data || err);
      const detail =
        err?.response?.data?.title ||
        err?.response?.data?.message ||
        JSON.stringify(err?.response?.data) ||
        err.message;
      message.error("Cập nhật ca tập thất bại: " + (detail || ""));
    }
  };

  const columns = [
    {
      title: "Tên ca",
      dataIndex: "slotName",
      key: "slotName",
      width: 200,
      render: (v) => v || "—",
    },
    {
      title: "Giờ bắt đầu",
      dataIndex: "startTime",
      key: "startTime",
      width: 150,
      render: (v) => (v ? String(v).substring(0, 5) : "—"), // HH:mm
    },
    {
      title: "Giờ kết thúc",
      dataIndex: "endTime",
      key: "endTime",
      width: 150,
      render: (v) => (v ? String(v).substring(0, 5) : "—"),
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
          <AdminSidebar />
        </div>
        <div className="col-lg-9">
          <h2 className="mb-4 text-center">Quản lý ca tập (Time Slot)</h2>

          {/* Card thêm TimeSlot */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h5 className="mb-3">Thêm ca tập mới</h5>
              <Form form={addForm} layout="vertical" onFinish={handleAdd}>
                <div className="row g-3">
                  <div className="col-md-4">
                    <Form.Item
                      name="slotName"
                      rules={[{ required: true, message: "Nhập tên ca" }]}
                    >
                      <Input placeholder="Tên ca (VD: Ca 1)" />
                    </Form.Item>
                  </div>

                  <div className="col-md-4">
                    <Form.Item
                      name="startTime"
                      rules={[
                        { required: true, message: "Nhập giờ bắt đầu" },
                      ]}
                    >
                      <Input placeholder="Giờ bắt đầu (VD: 6:00 hoặc 06:00)" />
                    </Form.Item>
                  </div>

                  <div className="col-md-4">
                    <Form.Item
                      name="endTime"
                      rules={[
                        { required: true, message: "Nhập giờ kết thúc" },
                      ]}
                    >
                      <Input placeholder="Giờ kết thúc (VD: 7:00 hoặc 07:00)" />
                    </Form.Item>
                  </div>

                  <div className="col-md-4 d-flex align-items-end">
                    <Form.Item style={{ width: "100%", marginBottom: 0 }}>
                      <Button type="btn btn-add" htmlType="submit" block>
                        Thêm ca tập
                      </Button>
                    </Form.Item>
                  </div>
                </div>
              </Form>
            </div>
          </div>

          {/* Table danh sách TimeSlot */}
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="mb-3">Danh sách ca tập</h5>
              {loading ? (
                <div className="text-center py-5">
                  <Spin />
                </div>
              ) : (
                <Table
                  rowKey={(r) => r.id ?? r.timeSlotId}
                  columns={columns}
                  dataSource={timeSlots}
                  pagination={{ pageSize: 8 }}
                  scroll={{ x: "max-content" }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal edit TimeSlot */}
      <Modal
        title="Cập nhật ca tập"
        open={editOpen}
        onCancel={() => {
          setEditOpen(false);
          setEditingSlot(null);
          editForm.resetFields();
        }}
        onOk={() => editForm.submit()}
        okText="Lưu thay đổi"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={editForm} layout="vertical" onFinish={saveEdit}>
          <Form.Item
            name="slotName"
            label="Tên ca"
            rules={[{ required: true, message: "Nhập tên ca" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="startTime"
            label="Giờ bắt đầu"
            rules={[{ required: true, message: "Nhập giờ bắt đầu" }]}
          >
            <Input placeholder="VD: 6:00 hoặc 06:00" />
          </Form.Item>

          <Form.Item
            name="endTime"
            label="Giờ kết thúc"
            rules={[{ required: true, message: "Nhập giờ kết thúc" }]}
          >
            <Input placeholder="VD: 7:00 hoặc 07:00" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
