import { useEffect, useState } from "react";
import api from "../../config/axios";
import dayjs from "dayjs";
import { Form, DatePicker, Select, Input, InputNumber, Button, Spin, message } from "antd";
import Sidebar from "../../components/Sidebar";

export default function ManagerCreateMaintenanceSchedule() {
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form fields
  const [form] = Form.useForm();


  // Fetch list of equipment
  const fetchEquipments = async () => {
    setLoading(true);
    try {
      const res = await api.get("/Equipment");
      const data = Array.isArray(res.data)
        ? res.data
        : res.data.items || res.data.data || [];

      setEquipments(data);
    } catch (err) {
      message.error("Lỗi khi tải danh sách thiết bị");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipments();
  }, []);

  // Submit API
  const handleSubmit = async (values) => {
    try {
      await api.post("/MaintenanceSchedule", {
        equipmentId: values.equipmentId,
        scheduledDate: values.scheduledDate.toISOString(),
        description: values.description,
        estimatedDuration: values.estimatedDuration,
        notes: values.notes,
      });

      message.success("Tạo lịch bảo trì thành công!");
      form.resetFields();
    } catch (err) {
      message.error("Không thể tạo lịch bảo trì");
    }
  };


  return (
    <div className="container-fluid py-5">
      <div className="row g-4">

        <div className="col-lg-3">
          <Sidebar role="Manager" />
        </div>

        <div className="col-lg-9">
          <h3 className="mb-4 text-center">Tạo Lịch Bảo Trì Thiết Bị</h3>

          {loading ? (
            <div className="text-center py-5"><Spin /></div>
          ) : (
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
            >
              <div className="card shadow-sm p-4">

                {/* === Chọn thiết bị === */}
                <Form.Item
                  label={<span className="fw-bold">Thiết bị</span>}
                  name="equipmentId"
                  rules={[{ required: true, message: "Vui lòng chọn thiết bị" }]}
                >
                  <Select placeholder="-- Chọn thiết bị --">
                    {equipments.map((eq) => (
                      <Select.Option key={eq.id} value={eq.id}>
                        {eq.equipmentName} – {eq.model}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>


                {/* === Thời gian bảo trì === */}
                <Form.Item
                  label={<span className="fw-bold">Thời gian bảo trì</span>}
                  name="scheduledDate"
                  rules={[{ required: true, message: "Vui lòng chọn thời gian bảo trì" }]}
                >
                  <DatePicker
                    showTime={{ format: "HH:mm" }}
                    style={{ width: "100%" }}
                    format="DD/MM/YYYY HH:mm"
                    disabledDate={(current) =>
                      current && current < dayjs().startOf("day")
                    }
                  />
                </Form.Item>

                {/* === Mô tả === */}
                <Form.Item
                  label={<span className="fw-bold">Mô tả</span>}
                  name="description"
                >
                  <Input.TextArea rows={3} />
                </Form.Item>

                {/* === Thời lượng dự kiến === */}
                <Form.Item
                  label={<span className="fw-bold">Thời lượng dự kiến (phút)</span>}
                  name="estimatedDuration"
                  rules={[
                    { required: true, message: "Vui lòng nhập thời lượng" },
                  ]}
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    min={1}
                    placeholder="Ví dụ: 60"
                  />
                </Form.Item>

                {/* === Ghi chú === */}
                <Form.Item
                  label={<span className="fw-bold">Ghi chú</span>}
                  name="notes"
                >
                  <Input.TextArea rows={2} />
                </Form.Item>

                {/* === Submit === */}
                <div className="text-end">
                  <Button type="primary" htmlType="submit">
                    Tạo lịch bảo trì
                  </Button>
                </div>

              </div>
            </Form>

          )}
        </div>
      </div>
    </div>
  );
}
