
import { useEffect, useState } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import {
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Modal,
  Form,
  DatePicker,
  InputNumber,
  message,
  Spin,
} from "antd";
import api from "../../config/axios";
import dayjs from "dayjs";

const STATUS_OPTIONS = [
  "Đang hoạt động",
  "Đang bảo trì",
  "Hư hỏng",
  "Tồn kho",
];

const statusColor = {
  "Đang hoạt động": "green",
  "Đang bảo trì": "gold",
  "Hư hỏng": "red",
  "Tồn kho": "gray",
};

export default function EquipmentList() {
  const [equipments, setEquipments] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(false);

  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  /* =====================================
     FETCH LIST (SỬA THEO PAYLOAD)
  ===================================== */
  const fetchCategories = async () => {
    try {
      const res = await api.get("/EquipmentCategory");
      const raw = Array.isArray(res.data) ? res.data : res.data?.items || res.data?.data || [];

      const list = raw.map((c) => ({
        id: c.id || c.categoryId,
        name: c.categoryName || c.name,
      }));

      setCategories(list);
    } catch (err) {
      console.error("fetch categories error", err);
      message.error("Không thể tải danh mục thiết bị");
    }
  };

  const fetchEquipments = async () => {
    setLoading(true);
    try {
      const res = await api.get("/Equipment");
      const raw = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setEquipments(raw); // 👈 Lưu nguyên res.data
    } catch (err) {
      message.error("Lấy danh sách thất bại");
    } finally {
      setLoading(false);
    }
  };




  useEffect(() => {
    fetchCategories();
    fetchEquipments();
  }, []);


  /* =====================================
     ADD EQUIPMENT - đúng payload
  ===================================== */
  const handleAdd = async () => {
    try {
      const values = await addForm.validateFields();

      const body = {
        equipmentName: values.equipmentName,
        categoryId: Number(values.categoryId),
        model: values.model || "",
        serialNumber: values.serialNumber,
        purchaseDate: values.purchaseDate
          ? values.purchaseDate.toISOString()
          : new Date().toISOString(),
        purchaseCost: Number(values.purchaseCost ?? 0),
        warranty: values.warranty || "",
        status: values.status,
        location: values.location || "",
        imageUrl: values.imageUrl || "",
        description: values.description || "",
      };

      await api.post("/Equipment", body);
      message.success("Thêm thiết bị thành công");

      addForm.resetFields();
      fetchEquipments();
    } catch (err) {
      if (err?.errorFields) return;
      console.error(err);
      message.error("Thêm thiết bị thất bại");
    }
  };

  /* =====================================
     DELETE
  ===================================== */
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa thiết bị này?")) return;

    try {
      await api.delete(`/Equipment/${id}`);
      message.success("Xóa thành công");
      fetchEquipments();
    } catch (err) {
      console.error(err);
      message.error("Xóa thất bại");
    }
  };

  /* =====================================
     OPEN EDIT MODAL
  ===================================== */
  const openEditModal = (record) => {
    setEditingItem(record);

    editForm.setFieldsValue({
      equipmentName: record.equipmentName,
      categoryId: record.categoryId,
      model: record.model,
      serialNumber: record.serialNumber,
      purchaseDate: record.purchaseDate ? dayjs(record.purchaseDate) : null,
      purchaseCost: record.purchaseCost,
      warranty: record.warranty,
      status: record.status,
      location: record.location,
      imageUrl: record.imageUrl,
      description: record.description,
    });

    setIsEditOpen(true);
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    setEditingItem(null);
    editForm.resetFields();
  };

  /* =====================================
     SAVE EDIT
  ===================================== */
  const saveEditModal = async () => {
    try {
      const values = await editForm.validateFields();

      const body = {
        equipmentName: values.equipmentName,
        categoryId: Number(values.categoryId),
        model: values.model || "",
        serialNumber: values.serialNumber,
        purchaseDate: values.purchaseDate
          ? values.purchaseDate.toISOString()
          : new Date().toISOString(),
        purchaseCost: Number(values.purchaseCost ?? 0),
        warranty: values.warranty || "",
        status: values.status,
        location: values.location,
        imageUrl: values.imageUrl,
        description: values.description,
      };

      await api.put(`/Equipment/${editingItem.id}`, body);

      message.success("Cập nhật thiết bị thành công");

      closeEditModal();
      fetchEquipments();
    } catch (err) {
      if (err?.errorFields) return;
      console.error(err);
      message.error("Cập nhật thất bại");
    }
  };

  /* =====================================
     TABLE COLUMNS
  ===================================== */
  const columns = [
    {
      title: "Ảnh",
      dataIndex: "imageUrl",
      key: "imageUrl",
      width: 100,
      fixed: "left",
      render: (src, record) => (
        <img
          src={record.imageUrl || "/img/noimg.jpg"}
          alt={record.equipmentName}
          style={{
            width: 56,
            height: 56,
            borderRadius: 8,
            objectFit: "cover",
            border: "1px solid #ddd",
          }}
          onError={(e) => {
            if (e.target.dataset.fallback !== "done") {
              e.target.src = "/img/noimg.jpg";
              e.target.dataset.fallback = "done";
            }
          }}
        />
      ),
    },
    {
      title: "Tên máy",
      fixed: "left",
      dataIndex: "equipmentName",
      width: 150,
    },
    // {
    //   title: "Danh mục",
    //   dataIndex: "categoryName",
    //   width: 160,
    // },
    {
      title: "Serial",
      dataIndex: "serialNumber",
      width: 150,
    },
    {
      title: "Model",
      dataIndex: "model",
      width: 150,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 140,
      render: (v) => <Tag color={statusColor[v] || "default"}>{v}</Tag>,
    },
    {
      title: "Ngày mua",
      dataIndex: "purchaseDate",
      width: 140,
      render: (v) => (v ? dayjs(v).format("DD/MM/YYYY") : "—"),
    },
    {
      title: "Giá mua",
      dataIndex: "purchaseCost",
      width: 120,
      render: (v) => `${Number(v).toLocaleString()} đ`,
    },
    {
      title: "Vị trí",
      dataIndex: "location",
      width: 150,
    },
    {
      title: "Thao tác",
      width: 160,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openEditModal(record)}>
            Sửa
          </Button>
          <Button danger size="small" onClick={() => handleDelete(record.id)}>
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  /* =====================================
     RENDER
  ===================================== */
  return (
    <div className="container-fluid py-5">
      <div className="row g-4">
        <div className="col-lg-3">
          <AdminSidebar />
        </div>

        <div className="col-lg-9">
          <h2 className="mb-4 text-center">Quản lý Thiết bị</h2>

          {/* ADD FORM */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h5 className="mb-3">Thêm thiết bị</h5>

              <Form form={addForm} layout="vertical">
                <div className="row g-3">

                  <div className="col-md-4">
                    <Form.Item name="equipmentName" rules={[{ required: true }]}>
                      <Input placeholder="Tên máy" />
                    </Form.Item>
                  </div>
                  <div className="col-md-4">
                    <Form.Item name="categoryId" rules={[{ required: true, message: "Chọn danh mục" }]}>
                      <Select placeholder="Chọn danh mục">
                        {categories.map((c) => (
                          <Select.Option key={c.id} value={c.id}>
                            {c.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </div>
                  <div className="col-md-4">
                    <Form.Item name="serialNumber" rules={[{ required: true }]}>
                      <Input placeholder="Serial Number" />
                    </Form.Item>
                  </div>

                  <div className="col-md-4">
                    <Form.Item name="model">
                      <Input placeholder="Model" />
                    </Form.Item>
                  </div>

                  <div className="col-md-4">
                    <Form.Item name="purchaseDate">
                      <DatePicker style={{ width: "100%" }} placeholder="Ngày mua" />
                    </Form.Item>
                  </div>

                  <div className="col-md-4">
                    <Form.Item name="purchaseCost">
                      <InputNumber min={0} style={{ width: "100%" }} placeholder="Giá mua" />
                    </Form.Item>
                  </div>

                  <div className="col-md-4">
                    <Form.Item name="status" >
                      <Select>
                        {STATUS_OPTIONS.map((s) => (
                          <Select.Option key={s} value={s} placeholder="Trạng thái">
                            {s}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </div>

                  <div className="col-md-4">
                    <Form.Item name="location">
                      <Input placeholder="Vị trí" />
                    </Form.Item>
                  </div>

                  <div className="col-md-4">
                    <Form.Item name="imageUrl">
                      <Input placeholder="Ảnh (URL)" />
                    </Form.Item>
                  </div>

                  <div className="col-md-4">
                    <Form.Item name="warranty">
                      <Input placeholder="Bảo hành" />
                    </Form.Item>
                  </div>

                  <div className="col-md-8">
                    <Form.Item name="description">
                      <Input.TextArea rows={1} placeholder="Mô tả" />
                    </Form.Item>
                  </div>

                  <div className="col-12">
                    <Button type="btn btn-add" onClick={handleAdd}>
                      Thêm thiết bị
                    </Button>
                  </div>
                </div>
              </Form>
            </div>
          </div>

          {/* TABLE */}
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="mb-3">Danh sách thiết bị</h5>

              {loading ? (
                <div className="text-center py-5">
                  <Spin />
                </div>
              ) : (
                <Table
                  rowKey={(r) => r.id}
                  columns={columns}
                  dataSource={equipments}
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: "max-content" }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      <Modal
        open={isEditOpen}
        title="Cập nhật thiết bị"
        onCancel={closeEditModal}
        onOk={saveEditModal}
        okText="Lưu thay đổi"
        cancelText="Hủy"
      >
        <Form form={editForm} layout="vertical">

          <Form.Item name="equipmentName" label="Tên máy" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="categoryId" label="Category ID" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="serialNumber" label="Serial Number" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="model" label="Model">
            <Input />
          </Form.Item>

          <Form.Item name="purchaseDate" label="Ngày mua">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="purchaseCost" label="Giá mua">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="warranty" label="Bảo hành">
            <Input />
          </Form.Item>

          <Form.Item name="status" label="Trạng thái">
            <Select>
              {STATUS_OPTIONS.map((s) => (
                <Select.Option key={s} value={s}>
                  {s}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="location" label="Vị trí">
            <Input />
          </Form.Item>

          <Form.Item name="imageUrl" label="Ảnh (URL)">
            <Input />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} />
          </Form.Item>

          <img
            src={editingItem?.imageUrl || "/img/nomig.jpg"}
            alt="preview"
            style={{
              width: 70,
              height: 70,
              borderRadius: 8,
              objectFit: "cover",
              border: "1px solid #ddd",
            }}
            onError={(e) => (e.currentTarget.src = "/img/noimg.jpg")}
          />
        </Form>
      </Modal>
    </div>
  );
}
