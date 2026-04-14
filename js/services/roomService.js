// ============================================
// ROOM SERVICE - Firebase CRUD phòng & giường
// ============================================
// ============================================
// ROOM SERVICE - Firebase CRUD phòng & giường
// ============================================

import { db } from "../firebase-config.js";
import { collection, getDocs, addDoc, doc, updateDoc, arrayUnion, arrayRemove, setDoc } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

const ROOMS_COLLECTION = "rooms";

const roomService = {
    // Cập nhật vị trí cho một giường trong phòng
    async updateBedPosition(roomId, bedIdx, position) {
      const roomRef = doc(db, ROOMS_COLLECTION, roomId);
      const roomSnap = await getDocs(collection(db, ROOMS_COLLECTION));
      const room = roomSnap.docs.find(d => d.id === roomId);
      if (!room) return { success: false, message: "Không tìm thấy phòng" };
      const beds = room.data().beds || [];
      if (bedIdx < 0 || bedIdx >= beds.length) return { success: false, message: "Không tìm thấy giường" };
      beds[bedIdx] = { ...beds[bedIdx], position };
      await updateDoc(roomRef, { beds });
      return { success: true };
    },
  async getRooms() {
    const querySnapshot = await getDocs(collection(db, ROOMS_COLLECTION));
    return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
  },
  async addRoom(name, beds = []) {
    await addDoc(collection(db, ROOMS_COLLECTION), {
      name,
      beds: beds.length ? beds : []
    });
  },
  async addBed(roomId) {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    const roomSnap = await getDocs(collection(db, ROOMS_COLLECTION));
    const room = roomSnap.docs.find(d => d.id === roomId);
    if (!room) return;
    const beds = room.data().beds || [];
    // Đặt tên giường theo số lượng hiện tại + 1
    const bedName = `Giường ${beds.length + 1}`;
    beds.push({ name: bedName, occupied: false, patientName: "" });
    await updateDoc(roomRef, { beds });
  },
  async removeBed(roomId) {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    const roomSnap = await getDocs(collection(db, ROOMS_COLLECTION));
    const room = roomSnap.docs.find(d => d.id === roomId);
    if (!room) return;
    let beds = room.data().beds || [];
    if (beds.length > 0) beds.pop();
    await updateDoc(roomRef, { beds });
  },

  // Cập nhật trạng thái giường (occupied, patientName) cho 1 phòng
  async updateBedStatus(roomName, bedName, occupied, patientName = "") {
    // Tìm document phòng theo tên
    const querySnapshot = await getDocs(collection(db, ROOMS_COLLECTION));
    const roomDoc = querySnapshot.docs.find(docSnap => (docSnap.data().name || "").toString() === roomName.toString());
    if (!roomDoc) return { success: false, message: "Không tìm thấy phòng" };
    const roomRef = doc(db, ROOMS_COLLECTION, roomDoc.id);
    const roomData = roomDoc.data();
    const beds = (roomData.beds || []).map(bed => {
      if ((typeof bed === 'object' ? bed.name : bed) === bedName) {
        return { ...bed, occupied, patientName };
      }
      return bed;
    });
    await updateDoc(roomRef, { beds });
    return { success: true };
  }
};

export default roomService;

