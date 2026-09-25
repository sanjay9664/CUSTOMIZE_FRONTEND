import React from 'react';
import { Row, Col } from 'react-bootstrap';

/**
 * AgTankSkeleton - Placeholder skeletons while devices and telemetry load
 */
const AgTankSkeleton = ({ count = 4, isFullscreen = false }) => {
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <Row className="g-4">
      {items.map((i) => (
        <Col
          key={i}
          xs={12}
          sm={6}
          md={isFullscreen ? 4 : 6}
          lg={isFullscreen ? 3 : 4}
          xl={isFullscreen ? 3 : 3}
        >
          <div
            className="p-3 rounded-4 position-relative"
            style={{
              background: 'rgba(15, 23, 42, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              minHeight: '210px'
            }}
          >
            {/* Header placeholder */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div
                className="rounded"
                style={{
                  width: '55%',
                  height: '14px',
                  background: 'rgba(255, 255, 255, 0.07)',
                  animation: 'ag-pulse 1.5s infinite'
                }}
              />
              <div
                className="rounded-pill"
                style={{
                  width: '50px',
                  height: '16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  animation: 'ag-pulse 1.5s infinite'
                }}
              />
            </div>

            {/* Split body: Vessel on left, Stats on right */}
            <div className="d-flex align-items-center justify-content-between gap-3 my-2">
              <div
                className="rounded"
                style={{
                  width: '68px',
                  height: '110px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '2px dashed rgba(255, 255, 255, 0.08)',
                  animation: 'ag-pulse 1.5s infinite'
                }}
              />

              <div className="flex-grow-1 text-end ps-2 d-flex flex-column align-items-end gap-2">
                <div
                  className="rounded"
                  style={{
                    width: '60px',
                    height: '28px',
                    background: 'rgba(56, 189, 248, 0.1)',
                    animation: 'ag-pulse 1.5s infinite'
                  }}
                />
                <div
                  className="rounded-pill"
                  style={{
                    width: '70px',
                    height: '16px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    animation: 'ag-pulse 1.5s infinite'
                  }}
                />
                <div
                  className="rounded"
                  style={{
                    width: '90px',
                    height: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    animation: 'ag-pulse 1.5s infinite'
                  }}
                />
                <div
                  className="rounded"
                  style={{
                    width: '75px',
                    height: '10px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    animation: 'ag-pulse 1.5s infinite'
                  }}
                />
              </div>
            </div>

            {/* Footer placeholder */}
            <div className="d-flex justify-content-between align-items-center pt-2 mt-2 border-top border-white border-opacity-5">
              <div
                className="rounded"
                style={{
                  width: '45px',
                  height: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  animation: 'ag-pulse 1.5s infinite'
                }}
              />
              <div
                className="rounded"
                style={{
                  width: '90px',
                  height: '10px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  animation: 'ag-pulse 1.5s infinite'
                }}
              />
            </div>
          </div>
        </Col>
      ))}
    </Row>
  );
};

export default React.memo(AgTankSkeleton);
