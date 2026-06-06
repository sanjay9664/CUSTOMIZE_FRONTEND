import React, { useState } from 'react';
import { Row, Col, Card, Badge, Form, Button, Table, Modal } from 'react-bootstrap';
import { Calendar, Clock, MapPin, Users, Plus, Edit, Trash2 } from 'lucide-react';

const MOCK_ROOMS = [
  { id: 1, name: 'Main Conference Room', group: 'Management', assignedACs: ['Cassette AC 1', 'Split AC 2'], schedule: '09:00 AM - 06:00 PM', setTemp: 22 },
  { id: 2, name: 'Server Room', group: 'IT Dept', assignedACs: ['Cassette AC 3'], schedule: '24/7', setTemp: 18 },
  { id: 3, name: 'Cafeteria', group: 'Common', assignedACs: ['Split AC 4', 'Split AC 5'], schedule: '12:00 PM - 03:00 PM', setTemp: 24 }
];

const ACScheduler = () => {
  const [rooms, setRooms] = useState(MOCK_ROOMS);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', group: '', scheduleStart: '', scheduleEnd: '', setTemp: 24 });

  const handleDelete = (id) => {
    setRooms(rooms.filter(r => r.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setRooms([...rooms, {
      id: rooms.length + 1,
      name: formData.name,
      group: formData.group,
      assignedACs: ['New AC'],
      schedule: `${formData.scheduleStart} - ${formData.scheduleEnd}`,
      setTemp: formData.setTemp
    }]);
    setShowModal(false);
  };

  return (
    <div className="fade-in p-4 h-100" style={{ background: '#0b1121', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <h4 className="text-white fw-black mb-1 d-flex align-items-center" style={{ letterSpacing: '1px' }}>
          <Calendar className="me-2 text-info" size={28} />
          AC SCHEDULER & ROOM GROUPS
        </h4>
        <Button variant="info" className="rounded-pill px-4 fw-bold shadow d-flex align-items-center gap-2" onClick={() => setShowModal(true)}>
          <Plus size={18} /> CREATE ROOM SCHEDULE
        </Button>
      </div>

      <Card className="border-0 shadow-lg" style={{ background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <Card.Body className="p-0">
          <Table hover responsive className="mb-0 text-white" style={{ '--bs-table-bg': 'transparent', '--bs-table-color': '#fff' }}>
            <thead style={{ background: 'rgba(0,0,0,0.3)' }}>
              <tr>
                <th className="py-3 px-4 text-secondary fs-12 tracking-widest border-bottom border-secondary border-opacity-25">ROOM NAME</th>
                <th className="py-3 px-4 text-secondary fs-12 tracking-widest border-bottom border-secondary border-opacity-25">USER GROUP</th>
                <th className="py-3 px-4 text-secondary fs-12 tracking-widest border-bottom border-secondary border-opacity-25">ASSIGNED ACs</th>
                <th className="py-3 px-4 text-secondary fs-12 tracking-widest border-bottom border-secondary border-opacity-25">SCHEDULE</th>
                <th className="py-3 px-4 text-secondary fs-12 tracking-widest border-bottom border-secondary border-opacity-25">DEFAULT TEMP</th>
                <th className="py-3 px-4 text-secondary fs-12 tracking-widest border-bottom border-secondary border-opacity-25 text-end">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td className="py-3 px-4 align-middle fw-bold">
                    <MapPin size={14} className="text-info me-2" />
                    {room.name}
                  </td>
                  <td className="py-3 px-4 align-middle">
                    <Badge bg="secondary" className="bg-opacity-25 text-light fw-normal px-3 py-2 rounded-pill d-flex align-items-center" style={{ width: 'max-content' }}>
                      <Users size={12} className="me-2 text-info" /> {room.group}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 align-middle text-muted fs-11">
                    {room.assignedACs.join(', ')}
                  </td>
                  <td className="py-3 px-4 align-middle font-monospace text-info fs-11">
                    <Clock size={14} className="me-2" />
                    {room.schedule}
                  </td>
                  <td className="py-3 px-4 align-middle">
                    <div className="fw-black fs-5">{room.setTemp}<span className="fs-6 text-muted fw-normal">°C</span></div>
                  </td>
                  <td className="py-3 px-4 align-middle text-end">
                    <Button variant="link" className="text-info p-1 me-2"><Edit size={16} /></Button>
                    <Button variant="link" className="text-danger p-1" onClick={() => handleDelete(room.id)}><Trash2 size={16} /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* CREATE MODAL */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered className="scada-modal">
        <Modal.Header closeButton style={{ background: '#0f172a', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Modal.Title className="text-white fs-5 fw-bold">Configure Room Schedule</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit} style={{ background: '#0f172a' }}>
          <Modal.Body className="text-white">
            <Form.Group className="mb-3">
              <Form.Label className="text-secondary fs-12">Room Name</Form.Label>
              <Form.Control type="text" placeholder="e.g. Conference Room A" className="bg-dark text-white border-secondary" onChange={e => setFormData({...formData, name: e.target.value})} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="text-secondary fs-12">User Group</Form.Label>
              <Form.Select className="bg-dark text-white border-secondary" onChange={e => setFormData({...formData, group: e.target.value})} required>
                <option value="">Select Group...</option>
                <option value="Management">Management</option>
                <option value="IT Dept">IT Dept</option>
                <option value="Operations">Operations</option>
              </Form.Select>
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-secondary fs-12">Turn ON Time</Form.Label>
                  <Form.Control type="time" className="bg-dark text-white border-secondary" onChange={e => setFormData({...formData, scheduleStart: e.target.value})} required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-secondary fs-12">Turn OFF Time</Form.Label>
                  <Form.Control type="time" className="bg-dark text-white border-secondary" onChange={e => setFormData({...formData, scheduleEnd: e.target.value})} required />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label className="text-secondary fs-12">Default Set Temp (°C)</Form.Label>
              <Form.Control type="number" min="16" max="30" value={formData.setTemp} className="bg-dark text-white border-secondary" onChange={e => setFormData({...formData, setTemp: e.target.value})} required />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <Button variant="outline-secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="info" type="submit">Save Schedule</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <style dangerouslySetInnerHTML={{__html: `
        .scada-modal .modal-content { border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; overflow: hidden; }
        .fs-12 { font-size: 0.75rem !important; }
        .fs-11 { font-size: 0.8rem !important; }
        .tracking-widest { letter-spacing: 1px !important; }
      `}} />
    </div>
  );
};

export default ACScheduler;
