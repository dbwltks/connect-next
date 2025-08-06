"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Car,
  Plus,
  Users,
  Edit3,
  Trash2,
  Phone,
  MapPin,
  Settings,
  Search,
  UserPlus,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { loadProgramData } from "../utils/program-data";

interface RideTabProps {
  programId: string;
  hasEditPermission?: boolean;
}

interface RideSettings {
  locations: string[];
  statuses: {
    id: string;
    label: string;
    color: string;
  }[];
}

interface Passenger {
  id: string;
  name: string;
  phone?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  notes?: string;
}

interface RideData {
  id: string;
  carName: string;
  carType: string;
  description: string;
  driver: string;
  coDriver?: string;
  departureTime: string;
  departureLocation: string;
  destination: string;
  maxCapacity: number;
  passengers: Passenger[];
  status: string;
}

const DEFAULT_STATUSES = [
  { id: "planned", label: "예정", color: "#6b7280" },
  { id: "active", label: "운행중", color: "#3b82f6" },
  { id: "completed", label: "완료", color: "#10b981" },
  { id: "cancelled", label: "취소", color: "#ef4444" },
];

const DEFAULT_LOCATIONS = ["학교", "기숙사", "시내", "공항", "기차역"];

export default function RideTab({ programId, hasEditPermission = true }: RideTabProps) {
  const [rides, setRides] = useState<RideData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRide, setEditingRide] = useState<RideData | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [rideSettings, setRideSettings] = useState<RideSettings>({
    locations: DEFAULT_LOCATIONS,
    statuses: DEFAULT_STATUSES,
  });

  const [newRide, setNewRide] = useState<Partial<RideData>>({
    carName: "",
    carType: "",
    description: "",
    driver: "",
    coDriver: "",
    departureTime: "",
    departureLocation: "",
    destination: "",
    maxCapacity: 4,
    status: "planned",
    passengers: [],
  });

  const [participants, setParticipants] = useState<any[]>([]);

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, [programId]);

  // 수정 모드일 때 newRide를 editingRide 데이터로 초기화
  useEffect(() => {
    if (editingRide) {
      setNewRide({
        carName: editingRide.carName,
        carType: editingRide.carType,
        description: editingRide.description,
        driver: editingRide.driver,
        coDriver: editingRide.coDriver,
        departureTime: editingRide.departureTime,
        departureLocation: editingRide.departureLocation,
        destination: editingRide.destination,
        maxCapacity: editingRide.maxCapacity,
        status: editingRide.status,
        passengers: editingRide.passengers,
      });
    } else {
      setNewRide({
        carName: "",
        carType: "",
        description: "",
        driver: "",
        coDriver: "",
        departureTime: "",
        departureLocation: "",
        destination: "",
        maxCapacity: 4,
        status: "planned",
        passengers: [],
      });
    }
  }, [editingRide]);

  const loadData = async () => {
    try {
      setLoading(true);
      const programData = await loadProgramData(programId);
      
      if (programData) {
        setRides(programData.rides || []);
        setParticipants(programData.participants || []);
        
        // 일정 설정의 장소와 라이드 설정의 장소를 통합
        const eventsLocations = programData.events_settings?.locations || [];
        const rideLocations = programData.ride_settings?.locations || DEFAULT_LOCATIONS;
        
        // 중복 제거하여 통합 장소 목록 생성
        const combinedSet = new Set([...eventsLocations, ...rideLocations]);
        const combinedLocations = Array.from(combinedSet);
        const finalLocations = combinedLocations.length > 0 ? combinedLocations : DEFAULT_LOCATIONS;
        
        if (programData.ride_settings) {
          setRideSettings({
            locations: finalLocations,
            statuses: programData.ride_settings.statuses || DEFAULT_STATUSES,
          });
        } else {
          setRideSettings({
            locations: finalLocations,
            statuses: DEFAULT_STATUSES,
          });
        }
      } else {
        setRides([]);
        setParticipants([]);
        setRideSettings({
          locations: DEFAULT_LOCATIONS,
          statuses: DEFAULT_STATUSES,
        });
      }
    } catch (error) {
      setRides([]);
      setParticipants([]);
      setRideSettings({
        locations: DEFAULT_LOCATIONS,
        statuses: DEFAULT_STATUSES,
      });
    } finally {
      setLoading(false);
    }
  };

  const saveRides = async (updatedRides: RideData[]) => {
    try {
      const { error } = await supabase
        .from("programs")
        .update({ 
          rides: updatedRides,
          updated_at: new Date().toISOString()
        })
        .eq('id', programId);
      
      if (!error) {
        setRides(updatedRides);
      }
    } catch (e) {
      // Silent error handling
    }
  };

  const saveRideSettings = async (settings: RideSettings) => {
    try {
      const programData = await loadProgramData(programId);
      
      const { error } = await supabase
        .from("programs")
        .update({ 
          ride_settings: settings,
          events_settings: {
            ...programData?.events_settings,
            locations: settings.locations
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', programId);
      
      if (!error) {
        setRideSettings(settings);
      }
    } catch (e) {
      // Silent error handling
    }
  };

  const handleSaveRide = () => {
    if (editingRide) {
      // 수정 모드
      const updatedRide: RideData = {
        ...editingRide,
        carName: newRide.carName || "",
        carType: newRide.carType || "",
        description: newRide.description || "",
        driver: newRide.driver || "",
        coDriver: newRide.coDriver || "",
        departureTime: newRide.departureTime || "",
        departureLocation: newRide.departureLocation || "",
        destination: newRide.destination || "",
        maxCapacity: newRide.maxCapacity || 4,
        passengers: newRide.passengers || [],
        status: newRide.status || "planned",
      };

      const updatedRides = rides.map(ride => 
        ride.id === editingRide.id ? updatedRide : ride
      );
      saveRides(updatedRides);
      setEditingRide(null);
    } else {
      // 추가 모드
      const ride: RideData = {
        id: `ride_${Date.now()}`,
        carName: newRide.carName || "",
        carType: newRide.carType || "",
        description: newRide.description || "",
        driver: newRide.driver || "",
        coDriver: newRide.coDriver || "",
        departureTime: newRide.departureTime || "",
        departureLocation: newRide.departureLocation || "",
        destination: newRide.destination || "",
        maxCapacity: newRide.maxCapacity || 4,
        passengers: newRide.passengers || [],
        status: newRide.status || "planned",
      };

      const updatedRides = [...rides, ride];
      saveRides(updatedRides);
      setIsAddOpen(false);
    }
  };


  const deleteRide = (rideId: string) => {
    const updatedRides = rides.filter(ride => ride.id !== rideId);
    saveRides(updatedRides);
  };

  const addPassenger = (rideId: string, passenger: Omit<Passenger, 'id'>) => {
    const newPassenger: Passenger = {
      id: `passenger_${Date.now()}`,
      ...passenger,
    };

    const updatedRides = rides.map(ride =>
      ride.id === rideId
        ? { ...ride, passengers: [...ride.passengers, newPassenger] }
        : ride
    );
    saveRides(updatedRides);
  };

  const removePassenger = (rideId: string, passengerId: string) => {
    const updatedRides = rides.map(ride =>
      ride.id === rideId
        ? { ...ride, passengers: ride.passengers.filter(p => p.id !== passengerId) }
        : ride
    );
    saveRides(updatedRides);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = rideSettings.statuses.find(s => s.id === status);
    return (
      <span 
        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
        style={{ 
          backgroundColor: statusConfig?.color || "#6b7280",
          color: "#ffffff"
        }}
      >
        {statusConfig?.label || status}
      </span>
    );
  };

  if (loading) {
    return <div className="flex justify-center p-8">로딩 중...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">라이드 관리</h2>
        <div className="flex gap-2">
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                설정
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>라이드 설정</DialogTitle>
              </DialogHeader>
              
              <Tabs defaultValue="locations" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="locations">장소</TabsTrigger>
                  <TabsTrigger value="statuses">상태</TabsTrigger>
                </TabsList>
                
                <TabsContent value="locations" className="space-y-3 mt-4">
                  <div className="space-y-2">
                    {rideSettings.locations.map((location, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input 
                          value={location} 
                          onChange={(e) => {
                            const newLocations = [...rideSettings.locations];
                            newLocations[index] = e.target.value;
                            setRideSettings({...rideSettings, locations: newLocations});
                          }}
                          className="flex-1 h-8 text-sm"
                          placeholder="장소명"
                        />
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            const newLocations = rideSettings.locations.filter((_, i) => i !== index);
                            setRideSettings({...rideSettings, locations: newLocations});
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full h-8 text-sm"
                      onClick={() => {
                        setRideSettings({
                          ...rideSettings, 
                          locations: [...rideSettings.locations, "새 장소"]
                        });
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      장소 추가
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="statuses" className="space-y-3 mt-4">
                  <div className="space-y-2">
                    {rideSettings.statuses.map((status, index) => (
                      <div key={status.id} className="flex items-center gap-2">
                        <Input 
                          value={status.label} 
                          onChange={(e) => {
                            const newStatuses = [...rideSettings.statuses];
                            newStatuses[index] = {...status, label: e.target.value};
                            setRideSettings({...rideSettings, statuses: newStatuses});
                          }}
                          className="flex-1 h-8 text-sm"
                          placeholder="상태명"
                        />
                        <input
                          type="color"
                          value={status.color || "#6b7280"}
                          onChange={(e) => {
                            const newStatuses = [...rideSettings.statuses];
                            newStatuses[index] = {...status, color: e.target.value};
                            setRideSettings({...rideSettings, statuses: newStatuses});
                          }}
                          className="w-8 h-8 rounded border cursor-pointer"
                        />
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            const newStatuses = rideSettings.statuses.filter((_, i) => i !== index);
                            setRideSettings({...rideSettings, statuses: newStatuses});
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full h-8 text-sm"
                      onClick={() => {
                        const newStatus = {
                          id: `status_${Date.now()}`,
                          label: "새 상태",
                          color: "#6b7280"
                        };
                        setRideSettings({
                          ...rideSettings, 
                          statuses: [...rideSettings.statuses, newStatus]
                        });
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      상태 추가
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setIsSettingsOpen(false)}
                  className="h-8 text-sm"
                >
                  취소
                </Button>
                <Button 
                  onClick={() => {
                    saveRideSettings(rideSettings);
                    setIsSettingsOpen(false);
                  }}
                  className="h-8 text-sm"
                >
                  저장
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          {hasEditPermission && (
            <>
              <Button onClick={() => setIsAddOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                라이드 추가
              </Button>
              
              <Dialog open={isAddOpen || !!editingRide} onOpenChange={(open) => {
                if (!open) {
                  setIsAddOpen(false);
                  setEditingRide(null);
                }
              }}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg">{editingRide ? '라이드 수정' : '새 라이드 추가'}</DialogTitle>
                </DialogHeader>
                
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="basic">기본 정보</TabsTrigger>
                    <TabsTrigger value="passengers">승객 관리</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="basic" className="space-y-3 mt-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm">차량명</Label>
                        <Input
                          value={newRide.carName || ""}
                          onChange={(e) => setNewRide({...newRide, carName: e.target.value})}
                          placeholder="차량 이름"
                          className="h-9 text-sm mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">차종</Label>
                        <Input
                          value={newRide.carType || ""}
                          onChange={(e) => setNewRide({...newRide, carType: e.target.value})}
                          placeholder="승용차, 버스 등"
                          className="h-9 text-sm mt-1"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-sm">운전자</Label>
                        <div className="mt-1">
                          <ParticipantSearchInput
                            value={newRide.driver || ""}
                            onChange={(value) => setNewRide({...newRide, driver: value})}
                            placeholder="운전자 이름 (검색 가능)"
                            participants={participants}
                            onSelect={(participant) => setNewRide({...newRide, driver: participant.name})}
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm">최대 승객</Label>
                        <Input
                          type="number"
                          value={newRide.maxCapacity || 4}
                          onChange={(e) => setNewRide({...newRide, maxCapacity: parseInt(e.target.value)})}
                          className="h-9 text-sm mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">상태</Label>
                        <Select value={newRide.status} onValueChange={(value) => setNewRide({...newRide, status: value})}>
                          <SelectTrigger className="h-9 text-sm mt-1">
                            <SelectValue placeholder="상태 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {rideSettings.statuses.map(status => (
                              <SelectItem key={status.id} value={status.id}>{status.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm">출발지</Label>
                        <Select value={newRide.departureLocation} onValueChange={(value) => setNewRide({...newRide, departureLocation: value})}>
                          <SelectTrigger className="h-9 text-sm mt-1">
                            <SelectValue placeholder="출발지 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {rideSettings.locations.map(location => (
                              <SelectItem key={location} value={location}>{location}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm">목적지</Label>
                        <Select value={newRide.destination} onValueChange={(value) => setNewRide({...newRide, destination: value})}>
                          <SelectTrigger className="h-9 text-sm mt-1">
                            <SelectValue placeholder="목적지 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {rideSettings.locations.map(location => (
                              <SelectItem key={location} value={location}>{location}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm">출발 시간</Label>
                      <Input
                        type="datetime-local"
                        value={newRide.departureTime || ""}
                        onChange={(e) => setNewRide({...newRide, departureTime: e.target.value})}
                        className="h-9 text-sm mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">설명</Label>
                      <Textarea
                        value={newRide.description || ""}
                        onChange={(e) => setNewRide({...newRide, description: e.target.value})}
                        placeholder="라이드 설명"
                        rows={2}
                        className="text-sm mt-1 resize-none"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="passengers" className="space-y-4 mt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">승객 목록 ({(newRide.passengers || []).length} / {newRide.maxCapacity || 4}명)</h3>
                    </div>

                    {/* 현재 승객 목록 */}
                    {(newRide.passengers || []).length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">선택된 승객</Label>
                        <div className="grid gap-2 max-h-32 overflow-y-auto">
                          {(newRide.passengers || []).map((passenger) => (
                            <div key={passenger.id} className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded">
                              <div>
                                <span className="font-medium text-sm">{passenger.name}</span>
                                {passenger.phone && (
                                  <span className="text-xs text-gray-600 ml-2">{passenger.phone}</span>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => {
                                  const updatedPassengers = (newRide.passengers || []).filter(p => p.id !== passenger.id);
                                  setNewRide({...newRide, passengers: updatedPassengers});
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Tabs defaultValue="search" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="search" className="text-sm">
                          <Search className="h-3 w-3 mr-1" />
                          참여자 검색
                        </TabsTrigger>
                        <TabsTrigger value="direct" className="text-sm">
                          <UserPlus className="h-3 w-3 mr-1" />
                          직접 추가
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="search" className="space-y-3 mt-4">
                        <div>
                          <Label className="text-sm">참여자 검색</Label>
                          <div className="mt-1">
                            <ParticipantSearchInput
                              value=""
                              onChange={() => {}} // 승객 검색에서는 value를 유지하지 않음
                              placeholder="이름, 이메일, 전화번호로 검색"
                              participants={participants.filter(p => !(newRide.passengers || []).some(passenger => passenger.id === p.id))}
                              onSelect={(participant) => {
                                if ((newRide.passengers || []).length >= (newRide.maxCapacity || 4)) return;
                                
                                const newPassenger: Passenger = {
                                  id: participant.id,
                                  name: participant.name,
                                  phone: participant.phone,
                                  pickupLocation: "",
                                  dropoffLocation: "",
                                  notes: ""
                                };
                                
                                const updatedPassengers = [...(newRide.passengers || []), newPassenger];
                                setNewRide({...newRide, passengers: updatedPassengers});
                              }}
                            />
                          </div>
                        </div>
                        
                        {participants.length === 0 && (
                          <div className="p-4 text-center text-gray-500 text-sm border rounded">
                            등록된 참여자가 없습니다.
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="direct" className="space-y-3 mt-4">
                        <DirectPassengerAdd 
                          onAdd={(passenger) => {
                            if ((newRide.passengers || []).length >= (newRide.maxCapacity || 4)) return;
                            
                            const newPassenger: Passenger = {
                              id: `temp_${Date.now()}`,
                              ...passenger
                            };
                            
                            const updatedPassengers = [...(newRide.passengers || []), newPassenger];
                            setNewRide({...newRide, passengers: updatedPassengers});
                          }}
                          locations={rideSettings.locations}
                          disabled={(newRide.passengers || []).length >= (newRide.maxCapacity || 4)}
                        />
                      </TabsContent>
                    </Tabs>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => {
                    setIsAddOpen(false);
                    setEditingRide(null);
                  }} className="h-9 text-sm px-4">
                    취소
                  </Button>
                  <Button onClick={handleSaveRide} className="h-9 text-sm px-4">
                    {editingRide ? '수정' : '추가'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            </>
          )}
        </div>
      </div>

      {rides.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Car className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">등록된 라이드가 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {rides.map((ride) => (
            <Card key={ride.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{ride.carName}</CardTitle>
                    <p className="text-sm text-gray-600">{ride.carType} • {ride.driver}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(ride.status)}
                    {hasEditPermission && (
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => setEditingRide(ride)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => deleteRide(ride.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {ride.departureLocation} → {ride.destination}
                    </div>
                    {ride.departureTime && (
                      <div>
                        출발: {new Date(ride.departureTime).toLocaleString()}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">
                      승객 {ride.passengers.length} / {ride.maxCapacity}명
                    </span>
                  </div>

                  {ride.passengers.length > 0 && (
                    <div className="mt-3">
                      <div className="grid gap-2">
                        {ride.passengers.map((passenger) => (
                          <div key={passenger.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <div>
                              <span className="font-medium">{passenger.name}</span>
                              {passenger.phone && (
                                <span className="text-sm text-gray-600 ml-2">
                                  <Phone className="h-3 w-3 inline mr-1" />
                                  {passenger.phone}
                                </span>
                              )}
                            </div>
                            {hasEditPermission && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => removePassenger(ride.id, passenger.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {hasEditPermission && ride.passengers.length < ride.maxCapacity && (
                    <PassengerForm 
                      onAdd={(passenger) => addPassenger(ride.id, passenger)}
                      locations={rideSettings.locations}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

    </div>
  );
}

// 참여자 검색 인풋 컴포넌트
function ParticipantSearchInput({
  value,
  onChange,
  placeholder,
  participants,
  onSelect,
  className = ""
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  participants: any[];
  onSelect: (participant: any) => void;
  className?: string;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredParticipants = participants.filter(p => {
    if (!searchTerm) return false;
    const search = searchTerm.toLowerCase();
    return (
      p.name?.toLowerCase().includes(search) ||
      p.email?.toLowerCase().includes(search) ||
      p.phone?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="relative">
      <Input
        value={value || searchTerm}
        onChange={(e) => {
          const inputValue = e.target.value;
          if (value) {
            onChange(inputValue);
          } else {
            setSearchTerm(inputValue);
            setIsOpen(inputValue.length > 0);
          }
        }}
        onFocus={() => {
          if (!value && searchTerm) {
            setIsOpen(true);
          }
        }}
        onBlur={() => {
          // 약간의 지연을 두어 클릭 이벤트가 먼저 처리되도록 함
          setTimeout(() => setIsOpen(false), 200);
        }}
        placeholder={placeholder}
        className={`h-9 text-sm ${className}`}
      />
      
      {/* 검색 결과 드롭다운 */}
      {isOpen && filteredParticipants.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
          {filteredParticipants.map((participant) => (
            <div
              key={participant.id}
              className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
              onClick={() => {
                onSelect(participant);
                setSearchTerm("");
                setIsOpen(false);
              }}
            >
              <div className="flex-1">
                <div className="font-medium text-sm">{participant.name}</div>
                <div className="text-xs text-gray-600">
                  {participant.email && <span>{participant.email}</span>}
                  {participant.phone && <span className="ml-2">{participant.phone}</span>}
                </div>
              </div>
              <Plus className="h-4 w-4 text-gray-400" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 직접 승객 추가 컴포넌트
function DirectPassengerAdd({
  onAdd,
  locations,
  disabled = false
}: {
  onAdd: (passenger: Omit<Passenger, 'id'>) => void;
  locations: string[];
  disabled?: boolean;
}) {
  const [passenger, setPassenger] = useState({
    name: "",
    phone: "",
    pickupLocation: "",
    dropoffLocation: "",
    notes: "",
  });

  const handleAdd = () => {
    if (!passenger.name.trim()) return;
    
    onAdd(passenger);
    setPassenger({
      name: "",
      phone: "",
      pickupLocation: "",
      dropoffLocation: "",
      notes: "",
    });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm">이름 *</Label>
          <Input
            value={passenger.name}
            onChange={(e) => setPassenger({...passenger, name: e.target.value})}
            placeholder="승객 이름"
            className="h-9 text-sm mt-1"
            disabled={disabled}
          />
        </div>
        <div>
          <Label className="text-sm">연락처</Label>
          <Input
            value={passenger.phone}
            onChange={(e) => setPassenger({...passenger, phone: e.target.value})}
            placeholder="전화번호"
            className="h-9 text-sm mt-1"
            disabled={disabled}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm">탑승지</Label>
          <Select value={passenger.pickupLocation} onValueChange={(value) => setPassenger({...passenger, pickupLocation: value})} disabled={disabled}>
            <SelectTrigger className="h-9 text-sm mt-1">
              <SelectValue placeholder="탑승지 선택" />
            </SelectTrigger>
            <SelectContent>
              {locations.map(location => (
                <SelectItem key={location} value={location}>{location}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm">하차지</Label>
          <Select value={passenger.dropoffLocation} onValueChange={(value) => setPassenger({...passenger, dropoffLocation: value})} disabled={disabled}>
            <SelectTrigger className="h-9 text-sm mt-1">
              <SelectValue placeholder="하차지 선택" />
            </SelectTrigger>
            <SelectContent>
              {locations.map(location => (
                <SelectItem key={location} value={location}>{location}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-sm">메모</Label>
        <Textarea
          value={passenger.notes}
          onChange={(e) => setPassenger({...passenger, notes: e.target.value})}
          placeholder="추가 메모"
          rows={2}
          className="text-sm mt-1 resize-none"
          disabled={disabled}
        />
      </div>

      <Button 
        onClick={handleAdd} 
        disabled={!passenger.name.trim() || disabled} 
        className="w-full h-9 text-sm"
      >
        <Plus className="h-3 w-3 mr-1" />
        승객 추가
      </Button>
    </div>
  );
}

// 승객 추가 폼 컴포넌트
function PassengerForm({ 
  onAdd, 
  locations 
}: { 
  onAdd: (passenger: Omit<Passenger, 'id'>) => void;
  locations: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [passenger, setPassenger] = useState({
    name: "",
    phone: "",
    pickupLocation: "",
    dropoffLocation: "",
    notes: "",
  });

  const handleAdd = () => {
    if (!passenger.name) return;
    onAdd(passenger);
    setPassenger({
      name: "",
      phone: "",
      pickupLocation: "",
      dropoffLocation: "",
      notes: "",
    });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          승객 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">승객 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-sm">이름 *</Label>
            <Input
              value={passenger.name}
              onChange={(e) => setPassenger({...passenger, name: e.target.value})}
              placeholder="승객 이름"
              className="h-9 text-sm mt-1"
            />
          </div>
          <div>
            <Label className="text-sm">연락처</Label>
            <Input
              value={passenger.phone}
              onChange={(e) => setPassenger({...passenger, phone: e.target.value})}
              placeholder="전화번호"
              className="h-9 text-sm mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">탑승지</Label>
              <Select value={passenger.pickupLocation} onValueChange={(value) => setPassenger({...passenger, pickupLocation: value})}>
                <SelectTrigger className="h-9 text-sm mt-1">
                  <SelectValue placeholder="탑승지" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(location => (
                    <SelectItem key={location} value={location}>{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">하차지</Label>
              <Select value={passenger.dropoffLocation} onValueChange={(value) => setPassenger({...passenger, dropoffLocation: value})}>
                <SelectTrigger className="h-9 text-sm mt-1">
                  <SelectValue placeholder="하차지" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(location => (
                    <SelectItem key={location} value={location}>{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="h-9 text-sm px-4">
              취소
            </Button>
            <Button onClick={handleAdd} disabled={!passenger.name} className="h-9 text-sm px-4">
              추가
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

