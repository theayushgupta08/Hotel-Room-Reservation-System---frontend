const API_BASE_URL = 'http://localhost:8000';

export interface Room {
  room_number: number;
  floor: number;
  position: number;
  status: 'available' | 'booked';
  guest_id?: string | null;
}

export interface RoomStateResponse {
  rooms: Record<number, Room>;
  total_rooms: number;
  available_rooms: number;
  booked_rooms: number;
}

export interface BookingRequest {
  num_rooms: number;
  guest_id?: string;
}

export interface BookingResponse {
  success: boolean;
  message: string;
  booked_rooms: number[];
  total_travel_time?: number;
}

export interface MessageResponse {
  success: boolean;
  message: string;
}

export interface RandomOccupancyRequest {
  occupancy_percentage: number;
}

// API Functions
export const api = {
  async getRooms(): Promise<RoomStateResponse> {
    const response = await fetch(`${API_BASE_URL}/rooms`);
    if (!response.ok) {
      throw new Error('Failed to fetch rooms');
    }
    return response.json();
  },

  async bookRooms(numRooms: number, guestId?: string): Promise<BookingResponse> {
    const response = await fetch(`${API_BASE_URL}/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        num_rooms: numRooms,
        guest_id: guestId,
      } as BookingRequest),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to book rooms');
    }
    return response.json();
  },

  async resetBookings(): Promise<MessageResponse> {
    const response = await fetch(`${API_BASE_URL}/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Failed to reset bookings');
    }
    return response.json();
  },

  async generateRandomOccupancy(occupancyPercentage: number): Promise<MessageResponse> {
    const response = await fetch(`${API_BASE_URL}/random-occupancy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        occupancy_percentage: occupancyPercentage,
      } as RandomOccupancyRequest),
    });
    if (!response.ok) {
      throw new Error('Failed to generate random occupancy');
    }
    return response.json();
  },
};
