'use strict';

class Room {

  constructor(participantID, roomName) {
    this.participantID = participantID;
    this.name = roomName;
    this.participants = new Array();
  }

  participantCount() { return this.participants.length; }

  getAllWithProperty(property, value) {
    const participantsWithProperty = new Array();
    for (let i = 0; i < this.participantCount(); i++) {
      if (this.participants[i][property] === value) {
        participantsWithProperty.push(this.participants[i]);
      }
    }
    return participantsWithProperty;
  }

  addParticipant(participant) {
    this.participants.push(participant);
  }

  getParticipant(id) {
    for (let i = 0; i < this.participantCount(); i++) {
      if (this.participants[i][this.participantID] === id) {
        return this.participants[i];
      }
    }
  }

  getAllExcept(id) {
    if (this.participantCount() < 2) return null;
    const allParticipants = new Array();
    for (let i = 0; i < this.participantCount(); i++) {
      if (this.participants[i][this.participantID] !== id) {
        allParticipants.push(this.participants[i]);
      }
    }
    return allParticipants;
  }

  participantPresent(id) {
    for (let i = 0; i < this.participantCount(); i++) {
      if (this.participants[i][this.participantID] === id) {
        return true;
      }
    }
  }

  deleteParticipant(id) {
    for (let i = 0; i < this.participantCount(); i++) {
      if (this.participants[i][this.participantID] === id) {
        this.participants.splice(i, 1);
        return true;
      }
    }
  }
}

class House {

  constructor(participantID, defaultRoomName = 'default') {
    this.participantID = participantID;
    this.rooms = new Array();
    this.addRoom(defaultRoomName);
  }

  getParticipantByID(id) {
    for (let i = 0; i < this.getRoomCount(); i++) {
      const participant = this.rooms[i].getParticipant(id);
      if (participant) return participant;
    }
  }

  getRoomCount() { return this.rooms.length; }

  addRoom(roomName) {
    this.rooms.push(new Room(this.participantID, roomName));
  }

  checkIfPresent(id) {
    for (let i = 0; i < this.getRoomCount(); i++) {
      if (this.rooms[i].participantPresent(id)) return true;
    }
  }

  deleteParticipant(id) {
    const roomIndex = this.getRoomIndexByID(id);
    this.rooms[roomIndex].deleteParticipant(id);
  }

  getAllInRoomByParticipantName(id) {
    const roomIndex = this.getRoomIndexByID(id);
    return this.rooms[roomIndex].participants;
  }

  getAllInRoomExcept(id) {
    const roomIndex = this.getRoomIndexByID(id);
    return this.rooms[roomIndex].getAllExcept(id);
  }

  addParticipant(participant, roomName) {
    // Check if the connection has already been established
    if (this.checkIfPresent(participant[this.participantID]))
      throw ('connection already registered');

    for (let i = 0; i < this.getRoomCount(); i++) {
      if (this.rooms[i].name === roomName) {
        this.rooms[i].addParticipant(participant);
        return true;
      }
    }
  }

  getRoomIndexByName(roomName) {
    for (let i = 0; i < this.getRoomCount(); i++) {
      if (this.rooms[i].name === roomName) return i;
    }
    return false;
  }

  getRoomIndexByID(id) {
    return this.getRoomIndexByName(this.getRoomNameByID(id));
  }

  getRoomNameByID(id) {
    for (let i = 0; i < this.getRoomCount(); i++) {
      if (this.rooms[i].participantPresent(id)) return this.rooms[i].name;
    }
  }
}


if (!this.document) module.exports = House;