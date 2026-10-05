import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';

/**
 * UgPumpSkeleton - Preserves the exact SCADA schematic & electrical panel layout
 * during initial load or device switches to prevent layout shift.
 */
const UgPumpSkeleton = () => {
  return (
    <div className="ug-pump-skeleton animate-pulse">


      {/* SCADA Schematic and Technical Panel Skeletons */}
      <Row className="g-4">
        {/* Schematic Skeleton */}
        <Col lg={9}>
          <Card className="bg-transparent border-0 mb-4 overflow-hidden shadow-2xl h-100">
            <div
              className="scada-schematic-bg rounded-4 border border-secondary border-opacity-10 overflow-hidden"
              style={{ backgroundColor: '#020408', minHeight: '580px' }}
            >
              {/* Header Skeleton */}
              <div className="p-3 border-bottom border-secondary border-opacity-10 d-flex justify-content-between align-items-center">
                <div className="bg-secondary bg-opacity-30 rounded-2" style={{ width: '220px', height: '18px' }}></div>
                <div className="d-flex align-items-center gap-4">
                  <div className="bg-secondary bg-opacity-20 rounded-pill" style={{ width: '100px', height: '24px' }}></div>
                  <div className="bg-secondary bg-opacity-20 rounded-2" style={{ width: '70px', height: '32px' }}></div>
                  <div className="bg-secondary bg-opacity-20 rounded-2" style={{ width: '70px', height: '32px' }}></div>
                </div>
              </div>

              {/* Body SVG Skeleton Placeholders */}
              <div className="p-4 d-flex justify-content-between align-items-center" style={{ minHeight: '500px' }}>
                {/* 3 Tank Placeholders */}
                <div className="d-flex flex-column gap-4">
                  {[1, 2, 3].map(t => (
                    <div
                      key={t}
                      className="rounded-3 border border-secondary border-opacity-20 bg-dark bg-opacity-40 d-flex flex-column justify-content-center align-items-center"
                      style={{ width: '180px', height: '130px' }}
                    >
                      <div className="bg-secondary bg-opacity-30 rounded-2 mb-2" style={{ width: '80px', height: '28px' }}></div>
                      <div className="bg-secondary bg-opacity-20 rounded-2" style={{ width: '110px', height: '12px' }}></div>
                    </div>
                  ))}
                </div>

                {/* 4 Pump Card Placeholders */}
                <div className="d-flex flex-column gap-4 flex-grow-1 px-5">
                  {[1, 2, 3, 4].map(p => (
                    <div
                      key={p}
                      className="rounded-3 border border-secondary border-opacity-20 bg-dark bg-opacity-40 p-3 d-flex justify-content-between align-items-center"
                      style={{ minHeight: '60px' }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div className="rounded-circle bg-secondary bg-opacity-30" style={{ width: '36px', height: '36px' }}></div>
                        <div className="bg-secondary bg-opacity-20 rounded-2" style={{ width: '100px', height: '16px' }}></div>
                      </div>
                      <div className="rounded-circle bg-secondary bg-opacity-20" style={{ width: '44px', height: '44px' }}></div>
                    </div>
                  ))}
                </div>

                {/* Master Gauge Placeholder */}
                <div
                  className="rounded-circle border border-secondary border-opacity-20 bg-dark bg-opacity-40 d-flex flex-column justify-content-center align-items-center me-4"
                  style={{ width: '150px', height: '150px' }}
                >
                  <div className="bg-secondary bg-opacity-30 rounded-2 mb-2" style={{ width: '70px', height: '24px' }}></div>
                  <div className="bg-secondary bg-opacity-20 rounded-pill" style={{ width: '40px', height: '8px' }}></div>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        {/* Technical Panel Skeleton */}
        <Col lg={3} className="d-none d-lg-block">
          <div
            className="rounded-4 border border-secondary border-opacity-10 bg-dark bg-opacity-20 h-100 p-3 d-flex flex-column justify-content-between"
            style={{ minHeight: '580px' }}
          >
            <div>
              <div className="bg-secondary bg-opacity-30 rounded-2 mb-4" style={{ width: '140px', height: '20px' }}></div>
              <div className="bg-secondary bg-opacity-20 rounded-3 mb-3" style={{ height: '80px' }}></div>
              <div className="bg-secondary bg-opacity-20 rounded-3 mb-3" style={{ height: '80px' }}></div>
              <div className="bg-secondary bg-opacity-20 rounded-3 mb-3" style={{ height: '100px' }}></div>
            </div>
            <div className="bg-secondary bg-opacity-20 rounded-2" style={{ height: '24px' }}></div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default React.memo(UgPumpSkeleton);
