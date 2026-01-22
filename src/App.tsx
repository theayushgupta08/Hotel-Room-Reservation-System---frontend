import { useState, useEffect } from 'react';
import './App.css';
import { api } from './services/api';
import type { BookingResponse, RoomPathInfo } from './services/api';

interface RoomData {
  room_number: number;
  floor: number;
  position: number;
  status: 'available' | 'booked';
  guest_id?: string | null;
}

function App() {
  const [numRooms, setNumRooms] = useState<string>('1');
  const [rooms, setRooms] = useState<Record<number, RoomData>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [statistics, setStatistics] = useState({
    total_rooms: 97,
    available_rooms: 97,
    booked_rooms: 0,
  });
  const [showPathDialog, setShowPathDialog] = useState(false);
  const [roomPaths, setRoomPaths] = useState<RoomPathInfo[]>([]);

  // Initialize rooms data structure
  const initializeRooms = () => {
    const roomsMap: Record<number, RoomData> = {};
    
    // Floors 1-9: 10 rooms each
    for (let floor = 1; floor <= 9; floor++) {
      for (let pos = 0; pos < 10; pos++) {
        const roomNumber = floor * 100 + (pos + 1);
        roomsMap[roomNumber] = {
          room_number: roomNumber,
          floor: floor,
          position: pos,
          status: 'available',
        };
      }
    }
    
    // Floor 10: 7 rooms (1001-1007)
    for (let pos = 0; pos < 7; pos++) {
      const roomNumber = 1000 + (pos + 1);
      roomsMap[roomNumber] = {
        room_number: roomNumber,
        floor: 10,
        position: pos,
        status: 'available',
      };
    }
    
    setRooms(roomsMap);
  };

  useEffect(() => {
    initializeRooms();
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await api.getRooms();
      setRooms(response.rooms);
      setStatistics({
        total_rooms: response.total_rooms,
        available_rooms: response.available_rooms,
        booked_rooms: response.booked_rooms,
      });
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Failed to fetch rooms', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (msg: string, type: 'success' | 'error' = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleBook = async () => {
    const num = parseInt(numRooms);
    if (isNaN(num) || num < 1 || num > 5) {
      showMessage('Please enter a number between 1 and 5', 'error');
      return;
    }

    try {
      setLoading(true);
      const response: BookingResponse = await api.bookRooms(num);
      showMessage(
        `${response.message}. Travel time: ${response.total_travel_time} minutes`,
        'success'
      );
      await fetchRooms();
      
      // Show path dialog if room paths are available
      if (response.room_paths && response.room_paths.length > 0) {
        setRoomPaths(response.room_paths);
        setShowPathDialog(true);
      }
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Failed to book rooms', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      setLoading(true);
      await api.resetBookings();
      showMessage('All bookings have been reset', 'success');
      await fetchRooms();
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Failed to reset bookings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRandom = async () => {
    const occupancyPercentage = 30; // Default 30% occupancy
    try {
      setLoading(true);
      await api.generateRandomOccupancy(occupancyPercentage);
      showMessage(`Generated random occupancy (${occupancyPercentage}%)`, 'success');
      await fetchRooms();
    } catch (error) {
      showMessage(
        error instanceof Error ? error.message : 'Failed to generate random occupancy',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // Get rooms for a specific floor
  const getRoomsForFloor = (floor: number): RoomData[] => {
    return Object.values(rooms)
      .filter((room) => room.floor === floor)
      .sort((a, b) => a.position - b.position);
  };

  // Render room cell
  const renderRoom = (room: RoomData) => {
    const isBooked = room.status === 'booked';
    return (
      <div
        key={room.room_number}
        className={`room-cell ${isBooked ? 'booked' : 'available'}`}
        title={`Room ${room.room_number} - ${isBooked ? 'Booked' : 'Available'}`}
      >
        {room.room_number}
      </div>
    );
  };

  return (
    <div className="app-container">
      <h1>Hotel Room Reservation System</h1>
      
      {/* Control Panel */}
      <div className="control-panel">
        <div className="input-section">
          <div className="input-group">
            <label htmlFor="numRooms">No of Rooms:</label>
            <input
              id="numRooms"
              type="number"
              min="1"
              max="5"
              value={numRooms}
              onChange={(e) => setNumRooms(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="input-note">
            Maximum 5 rooms can be booked at a time
          </div>
        </div>
        <div className="button-group">
          <button onClick={handleBook} disabled={loading} className="btn btn-primary">
            {loading ? '⏳' : '📋'} {loading ? 'Booking...' : 'Book Rooms'}
          </button>
          <div className="secondary-buttons">
            <button onClick={handleReset} disabled={loading} className="btn btn-secondary">
              🔄 Reset
            </button>
            <button onClick={handleRandom} disabled={loading} className="btn btn-secondary">
              🎲 Random Occupancy
            </button>
          </div>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`message ${messageType}`}>{message}</div>
      )}

      {/* Statistics */}
      <div className="statistics">
        <span>
          <strong>Total:</strong> {statistics.total_rooms}
        </span>
        <span>
          <strong>Available:</strong> {statistics.available_rooms}
        </span>
        <span>
          <strong>Booked:</strong> {statistics.booked_rooms}
        </span>
      </div>

      {/* Hotel Layout */}
      <div className="hotel-layout">
        {/* Stairs/Lift Column */}
        <div className="stairs-column">
          <div className="stairs-label">Stairs/Lift</div>
        </div>

        {/* Rooms Grid */}
        <div className="rooms-grid">
          {/* Render floors from top (10) to bottom (1) */}
          {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((floor) => {
            const floorRooms = getRoomsForFloor(floor);
            return (
              <div key={floor} className="floor-row">
                <div className="floor-label">Floor {floor}</div>
                <div className="rooms-row">
                  {floorRooms.map((room) => renderRoom(room))}
                  {/* Fill empty spaces for floor 10 */}
                  {floor === 10 && Array.from({ length: 3 }).map((_, idx) => (
                    <div key={`empty-${idx}`} className="room-cell empty"></div>
                  ))}
                </div>
              </div>
            );
          })}
          
          {/* Ground Floor - Reception */}
          <div className="floor-row reception-row">
            <div className="floor-label">Ground Floor</div>
            <div className="reception-area">
              <div className="reception-content">
                <span className="reception-icon">🏨</span>
                <span className="reception-text">Reception</span>
                <span className="reception-subtext">(Starting Point)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="legend">
        <div className="legend-item">
          <div className="room-cell available"></div>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <div className="room-cell booked"></div>
          <span>Booked</span>
        </div>
      </div>

      {/* Path Dialog */}
      {showPathDialog && (
        <div className="dialog-overlay" onClick={() => setShowPathDialog(false)}>
          <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>Path to Your Rooms</h2>
              <button className="dialog-close" onClick={() => setShowPathDialog(false)}>
                ×
              </button>
            </div>
            <div className="dialog-body">
              <p className="dialog-subtitle">
                Directions from Reception (Ground Floor) to your booked rooms:
              </p>
              {roomPaths.map((path, index) => (
                <div key={path.room_number} className="room-path-card">
                  <div className="room-path-header">
                    <h3>Room {path.room_number}</h3>
                    <span className="travel-time-badge">
                      {path.total_time} minute{path.total_time !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="room-path-details">
                    <p className="room-location">
                      Floor {path.floor}, Position {path.position}
                    </p>
                    <div className="path-steps">
                      <h4>Directions:</h4>
                      <ol>
                        {path.steps.map((step, stepIndex) => (
                          <li key={stepIndex}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="dialog-footer">
              <button className="btn btn-primary" onClick={() => setShowPathDialog(false)}>
                ✓ Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
