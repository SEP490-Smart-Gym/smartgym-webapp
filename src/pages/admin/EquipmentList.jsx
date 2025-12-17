
import { useEffect, useRef, useState } from "react";
import Sidebar from "../../components/Sidebar";
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
  "Đang Hoạt Động",
  "Đang Bảo Trì",

];

const statusColor = {
  "Đang Hoạt Động": "green",
  "Đang Bảo Trì": "gold",
};

export default function EquipmentList() {
  const [equipments, setEquipments] = useState([]);
  const [categories, setCategories] = useState([]);
  //img upload
  const addFileInputRef = useRef(null);
  const editFileInputRef = useRef(null);
  const [pickedFile, setPickedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [editFile, setEditFile] = useState(null);




  const [loading, setLoading] = useState(false);

  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Category Modal
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [categoryForm] = Form.useForm();
  const [creatingCategory, setCreatingCategory] = useState(false);


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
      setEquipments(raw);
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
     ADD EQUIPMENT 
  ===================================== */
  const handleAdd = async () => {
    try {
      const values = await addForm.validateFields();

      if (!pickedFile) {
        message.warning("Vui lòng chọn ảnh thiết bị");
        return;
      }

      const formData = new FormData();

      formData.append("EquipmentName", values.equipmentName);
      formData.append("CategoryId", values.categoryId);
      formData.append("Model", values.model || "");
      formData.append("SerialNumber", values.serialNumber);
      formData.append(
        "PurchaseDate",
        values.purchaseDate
          ? values.purchaseDate.format("YYYY-MM-DD")
          : new Date().toISOString().split("T")[0]
      );
      formData.append("PurchaseCost", values.purchaseCost || 0);
      formData.append("Warranty", values.warranty || "");
      formData.append("Status", values.status);
      formData.append("Location", values.location || "");
      formData.append("Description", values.description || "");

      formData.append("ImageFile", pickedFile);

      await api.post("/Equipment", formData);
      message.success("Thêm thiết bị thành công");

      addForm.resetFields();
      setPickedFile(null);
      setPreviewImage(null);

      if (addFileInputRef.current) {
        addFileInputRef.current.value = "";
      }

      setPickedFile(null);
      setPreviewImage(null);
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
  const handleDelete = (equipment) => {
    Modal.confirm({
      title: "Xác nhận xoá thiết bị",
      content: (
        <>
          <p>
            Bạn có chắc chắn muốn xoá thiết bị:
            <strong> {equipment.equipmentName || "Thiết bị này"}</strong>?
          </p>
        </>
      ),
      okText: "Xoá",
      okType: "danger",
      cancelText: "Huỷ",
      async onOk() {
        try {
          await api.delete(`/Equipment/${equipment.id}`);
          message.success("Xoá thiết bị thành công");
          fetchEquipments();
        } catch (err) {
          console.error(err);
          message.error("Xoá thiết bị thất bại");
        }
      },
    });
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

      const formData = new FormData();
      formData.append("EquipmentName", values.equipmentName);
      formData.append("CategoryId", values.categoryId);
      formData.append("Model", values.model || "");
      formData.append("SerialNumber", values.serialNumber);
      formData.append(
        "PurchaseDate",
        values.purchaseDate
          ? values.purchaseDate.format("YYYY-MM-DD")
          : null
      );
      formData.append("PurchaseCost", values.purchaseCost || 0);
      formData.append("Warranty", values.warranty || "");
      formData.append("Status", values.status);
      formData.append("Location", values.location || "");
      formData.append("Description", values.description || "");

      // 🔥 chỉ append nếu user chọn ảnh mới
      if (editFile) {
        formData.append("ImageFile", editFile);
      }

      await api.put(`/Equipment/${editingItem.id}`, formData);

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
          <Button danger size="small" onClick={() => handleDelete(record)}>
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
          <Sidebar role="Admin" />
        </div>

        <div className="col-lg-9">
          <h2 className="mb-4 text-center">Quản lý Thiết bị</h2>
          <div className="d-flex justify-content-end mb-3">
            <Button type="primary" onClick={() => setIsCategoryOpen(true)}>
              + Thêm danh mục
            </Button>
          </div>


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
                    <Form.Item name="warranty">
                      <Input placeholder="Bảo hành" />
                    </Form.Item>
                  </div>
                  <div className="col-md-4">
                    <Form.Item>
                      <Button
                        htmlType="button"
                        onClick={() => addFileInputRef.current?.click()}
                      >
                        Chọn ảnh
                      </Button>

                      <input
                        ref={addFileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          setPickedFile(file);
                          setPreviewImage(URL.createObjectURL(file));
                        }}
                      />


                      {previewImage && (
                        <img
                          src={previewImage}
                          alt="preview"
                          style={{
                            marginTop: 8,
                            width: 80,
                            height: 80,
                            objectFit: "cover",
                            borderRadius: 8,
                            border: "1px solid #ddd",
                          }}
                        />
                      )}
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

          <Form.Item label="Đổi ảnh (nếu có)">
            <Button
              htmlType="button"
              onClick={() => editFileInputRef.current?.click()}
            >
              Chọn ảnh mới
            </Button>

            <input
              ref={editFileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                setEditFile(file);
                setPreviewImage(URL.createObjectURL(file));
              }}
            />

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
      {/* CATEGORY MODAL */}
      <Modal
        open={isCategoryOpen}
        title="Thêm danh mục thiết bị"
        okText="Thêm danh mục"
        cancelText="Hủy"
        confirmLoading={creatingCategory}
        onCancel={() => {
          setIsCategoryOpen(false);
          categoryForm.resetFields();
        }}
        onOk={() => categoryForm.submit()}
      >
        <Form
          form={categoryForm}
          layout="vertical"
          onFinish={async (values) => {
            try {
              setCreatingCategory(true);

              await api.post("/EquipmentCategory", {
                categoryName: values.categoryName,
                description: values.description || "",
              });

              message.success("Thêm danh mục thành công");
              setIsCategoryOpen(false);
              categoryForm.resetFields();

              // reload danh mục để Select cập nhật
              fetchCategories();
            } catch (err) {
              console.error(err);
              message.error("Thêm danh mục thất bại");
            } finally {
              setCreatingCategory(false);
            }
          }}
        >
          <Form.Item
            name="categoryName"
            label="Tên danh mục"
            rules={[{ required: true, message: "Nhập tên danh mục" }]}
          >
            <Input placeholder="VD: Cardio, Strength, Machine..." />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} placeholder="Mô tả danh mục (không bắt buộc)" />
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
}
