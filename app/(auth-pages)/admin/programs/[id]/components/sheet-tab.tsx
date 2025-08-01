"use client";

import React, { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileSpreadsheet,
  Plus,
  Save,
  Trash2,
  Download,
  Upload,
  Calendar,
  Users,
  BarChart3,
  Settings,
  MoreHorizontal,
  MoreVertical,
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { createClient } from "@/utils/supabase/client";

interface SheetTabProps {
  programId: string;
  onNavigateToTab: (tab: string) => void;
}

interface SpreadsheetData {
  id: string;
  name: string;
  description?: string;
  data: CellData[][];
  team_id?: string;
}

interface Program {
  id: string;
  name: string;
  spreadsheets?: SpreadsheetData[];
  // ... 기타 프로그램 필드들
}

interface CellData {
  value: string;
  formula?: string;
  style?: {
    backgroundColor?: string;
    color?: string;
    fontWeight?: string;
    textAlign?: string;
  };
}

export default function SheetTab({
  programId,
  onNavigateToTab,
}: SheetTabProps) {
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<Program | null>(null);
  const [spreadsheets, setSpreadsheets] = useState<SpreadsheetData[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<SpreadsheetData | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newSheetName, setNewSheetName] = useState('');
  
  // 스프레드시트 편집 상태
  const [editingCell, setEditingCell] = useState<{row: number, col: number} | null>(null);
  const [cellInput, setCellInput] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);
  
  // 컨텍스트 메뉴 상태
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    type: 'row' | 'column' | 'cell';
    index: number;
  }>({
    show: false,
    x: 0,
    y: 0,
    type: 'cell',
    index: 0,
  });
  
  const supabase = createClient();

  // 스프레드시트 데이터 로드
  useEffect(() => {
    loadSpreadsheets();
  }, [programId]);

  // 편집 모드에서 포커스 설정
  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingCell]);

  // 컨텍스트 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(prev => ({ ...prev, show: false }));
    if (contextMenu.show) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu.show]);

  // 프로그램 및 스프레드시트 로드
  const loadSpreadsheets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('programs')
        .select('id, name, spreadsheets')
        .eq('id', programId)
        .single();

      if (error) throw error;
      
      setProgram(data);
      setSpreadsheets(data.spreadsheets || []);
    } catch (error) {
      console.error('Error loading program and spreadsheets:', error);
    } finally {
      setLoading(false);
    }
  };

  // 새 스프레드시트 생성
  const createNewSheet = async () => {
    if (!newSheetName.trim() || !program) return;

    try {
      // 기본 10x20 그리드 생성
      const defaultData: CellData[][] = Array(20).fill(null).map(() => 
        Array(10).fill(null).map(() => ({ value: '' }))
      );

      const newSheet: SpreadsheetData = {
        id: crypto.randomUUID(),
        name: newSheetName,
        description: '',
        data: defaultData,
        team_id: undefined,
      };

      const updatedSpreadsheets = [...spreadsheets, newSheet];

      const { error } = await supabase
        .from('programs')
        .update({ 
          spreadsheets: updatedSpreadsheets
        })
        .eq('id', programId);

      if (error) throw error;

      setSpreadsheets(updatedSpreadsheets);
      setNewSheetName('');
      setIsCreating(false);
      setSelectedSheet(newSheet);
    } catch (error) {
      console.error('Error creating spreadsheet:', error);
    }
  };

  // 스프레드시트 저장
  const saveSpreadsheet = async (sheet: SpreadsheetData) => {
    try {
      const updatedSpreadsheets = spreadsheets.map(s => 
        s.id === sheet.id ? sheet : s
      );

      const { error } = await supabase
        .from('programs')
        .update({ 
          spreadsheets: updatedSpreadsheets
        })
        .eq('id', programId);

      if (error) throw error;
      
      // 로컬 상태 업데이트
      setSpreadsheets(updatedSpreadsheets);
    } catch (error) {
      console.error('Error saving spreadsheet:', error);
    }
  };

  // 스프레드시트 삭제
  const deleteSpreadsheet = async (sheetId: string) => {
    if (!confirm('정말로 이 스프레드시트를 삭제하시겠습니까?')) return;

    try {
      const updatedSpreadsheets = spreadsheets.filter(s => s.id !== sheetId);

      const { error } = await supabase
        .from('programs')
        .update({ 
          spreadsheets: updatedSpreadsheets
        })
        .eq('id', programId);

      if (error) throw error;

      setSpreadsheets(updatedSpreadsheets);
      if (selectedSheet?.id === sheetId) {
        setSelectedSheet(null);
      }
    } catch (error) {
      console.error('Error deleting spreadsheet:', error);
    }
  };

  // 셀 편집 시작
  const startEditingCell = (row: number, col: number) => {
    if (!selectedSheet) return;
    
    const currentValue = selectedSheet.data[row]?.[col]?.value || '';
    setCellInput(currentValue);
    setEditingCell({ row, col });
  };

  // 셀 편집 완료
  const finishEditingCell = async () => {
    if (!editingCell || !selectedSheet) return;

    const newData = [...selectedSheet.data];
    if (!newData[editingCell.row]) {
      newData[editingCell.row] = Array(10).fill(null).map(() => ({ value: '' }));
    }
    if (!newData[editingCell.row][editingCell.col]) {
      newData[editingCell.row][editingCell.col] = { value: '' };
    }
    
    newData[editingCell.row][editingCell.col].value = cellInput;

    const updatedSheet = { ...selectedSheet, data: newData };
    setSelectedSheet(updatedSheet);
    await saveSpreadsheet(updatedSheet);

    setEditingCell(null);
    setCellInput('');
  };

  // 키보드 이벤트 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!editingCell) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      finishEditingCell();
      // 다음 행으로 이동
      if (editingCell.row < (selectedSheet?.data.length || 0) - 1) {
        setTimeout(() => {
          startEditingCell(editingCell.row + 1, editingCell.col);
        }, 50);
      }
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setCellInput('');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      finishEditingCell();
      // 다음 열로 이동
      const cols = Math.max(10, selectedSheet?.data[0]?.length || 0);
      if (editingCell.col < cols - 1) {
        setTimeout(() => {
          startEditingCell(editingCell.row, editingCell.col + 1);
        }, 50);
      }
    }
  };

  // 컬럼 헤더 생성 (A, B, C, ...)
  const getColumnHeader = (index: number): string => {
    let result = '';
    while (index >= 0) {
      result = String.fromCharCode(65 + (index % 26)) + result;
      index = Math.floor(index / 26) - 1;
    }
    return result;
  };

  // 행 추가
  const addRow = async () => {
    if (!selectedSheet) return;
    
    const newData = [...selectedSheet.data];
    const cols = Math.max(10, newData[0]?.length || 0);
    newData.push(Array(cols).fill(null).map(() => ({ value: '' })));
    
    const updatedSheet = { ...selectedSheet, data: newData };
    setSelectedSheet(updatedSheet);
    await saveSpreadsheet(updatedSheet);
  };

  // 열 추가
  const addColumn = async () => {
    if (!selectedSheet) return;
    
    const newData = selectedSheet.data.map(row => [
      ...row,
      { value: '' }
    ]);
    
    const updatedSheet = { ...selectedSheet, data: newData };
    setSelectedSheet(updatedSheet);
    await saveSpreadsheet(updatedSheet);
  };

  // 행 삭제
  const deleteRow = async (rowIndex: number) => {
    if (!selectedSheet || selectedSheet.data.length <= 1) return;
    
    const newData = selectedSheet.data.filter((_, index) => index !== rowIndex);
    const updatedSheet = { ...selectedSheet, data: newData };
    setSelectedSheet(updatedSheet);
    await saveSpreadsheet(updatedSheet);
  };

  // 열 삭제
  const deleteColumn = async (colIndex: number) => {
    if (!selectedSheet) return;
    
    const newData = selectedSheet.data.map(row => 
      row.filter((_, index) => index !== colIndex)
    );
    
    const updatedSheet = { ...selectedSheet, data: newData };
    setSelectedSheet(updatedSheet);
    await saveSpreadsheet(updatedSheet);
  };

  // 간단한 수식 계산 (SUM, AVERAGE 등)
  const calculateFormula = (formula: string, data: CellData[][]): string => {
    try {
      // SUM(A1:A5) 형태의 수식 처리
      if (formula.startsWith('=SUM(') && formula.endsWith(')')) {
        const range = formula.slice(5, -1); // "A1:A5"
        const [start, end] = range.split(':');
        const startCell = parseCellReference(start);
        const endCell = parseCellReference(end);
        
        let sum = 0;
        for (let row = startCell.row; row <= endCell.row; row++) {
          for (let col = startCell.col; col <= endCell.col; col++) {
            const value = parseFloat(data[row]?.[col]?.value || '0');
            if (!isNaN(value)) sum += value;
          }
        }
        return sum.toString();
      }
      
      // AVERAGE(A1:A5) 형태의 수식 처리
      if (formula.startsWith('=AVERAGE(') && formula.endsWith(')')) {
        const range = formula.slice(9, -1);
        const [start, end] = range.split(':');
        const startCell = parseCellReference(start);
        const endCell = parseCellReference(end);
        
        let sum = 0;
        let count = 0;
        for (let row = startCell.row; row <= endCell.row; row++) {
          for (let col = startCell.col; col <= endCell.col; col++) {
            const value = parseFloat(data[row]?.[col]?.value || '0');
            if (!isNaN(value)) {
              sum += value;
              count++;
            }
          }
        }
        return count > 0 ? (sum / count).toString() : '0';
      }
      
      // 간단한 산술 연산 (=A1+B1, =A1*B1 등)
      if (formula.startsWith('=')) {
        let expression = formula.slice(1);
        
        // 셀 참조를 값으로 변환
        expression = expression.replace(/[A-Z]+\d+/g, (match) => {
          const cell = parseCellReference(match);
          const value = data[cell.row]?.[cell.col]?.value || '0';
          return isNaN(parseFloat(value)) ? '0' : value;
        });
        
        // 안전한 수식 평가 (기본 연산만)
        try {
          const result = Function('"use strict"; return (' + expression + ')')();
          return isNaN(result) ? '#ERROR' : result.toString();
        } catch {
          return '#ERROR';
        }
      }
      
      return formula;
    } catch {
      return '#ERROR';
    }
  };

  // 셀 참조 파싱 (A1 -> {row: 0, col: 0})
  const parseCellReference = (ref: string): {row: number, col: number} => {
    const match = ref.match(/^([A-Z]+)(\d+)$/);
    if (!match) throw new Error('Invalid cell reference');
    
    const [, colStr, rowStr] = match;
    let col = 0;
    for (let i = 0; i < colStr.length; i++) {
      col = col * 26 + (colStr.charCodeAt(i) - 64);
    }
    col -= 1; // 0-based index
    
    const row = parseInt(rowStr) - 1; // 0-based index
    return { row, col };
  };

  // 셀 값 표시 (수식이 있으면 계산 결과 표시)
  const getCellDisplayValue = (cellData: CellData | undefined): string => {
    if (!cellData) return '';
    
    if (cellData.value.startsWith('=') && selectedSheet) {
      return calculateFormula(cellData.value, selectedSheet.data);
    }
    
    return cellData.value;
  };

  // 컨텍스트 메뉴 표시
  const showContextMenu = (e: React.MouseEvent, type: 'row' | 'column', index: number) => {
    e.preventDefault();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      type,
      index,
    });
  };

  // 컨텍스트 메뉴 액션 처리
  const handleContextMenuAction = (action: string) => {
    switch (action) {
      case 'addRowAbove':
        addRowAt(contextMenu.index);
        break;
      case 'addRowBelow':
        addRowAt(contextMenu.index + 1);
        break;
      case 'deleteRow':
        deleteRow(contextMenu.index);
        break;
      case 'addColumnLeft':
        addColumnAt(contextMenu.index);
        break;
      case 'addColumnRight':
        addColumnAt(contextMenu.index + 1);
        break;
      case 'deleteColumn':
        deleteColumn(contextMenu.index);
        break;
    }
    setContextMenu(prev => ({ ...prev, show: false }));
  };

  // 특정 위치에 행 추가
  const addRowAt = async (index: number) => {
    if (!selectedSheet) return;
    
    const newData = [...selectedSheet.data];
    const cols = Math.max(10, newData[0]?.length || 0);
    newData.splice(index, 0, Array(cols).fill(null).map(() => ({ value: '' })));
    
    const updatedSheet = { ...selectedSheet, data: newData };
    setSelectedSheet(updatedSheet);
    await saveSpreadsheet(updatedSheet);
  };

  // 특정 위치에 열 추가
  const addColumnAt = async (index: number) => {
    if (!selectedSheet) return;
    
    const newData = selectedSheet.data.map(row => {
      const newRow = [...row];
      newRow.splice(index, 0, { value: '' });
      return newRow;
    });
    
    const updatedSheet = { ...selectedSheet, data: newData };
    setSelectedSheet(updatedSheet);
    await saveSpreadsheet(updatedSheet);
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  // 스프레드시트 편집 화면
  if (selectedSheet) {
    const rows = Math.max(20, selectedSheet.data.length);
    const cols = Math.max(10, selectedSheet.data[0]?.length || 0);

    return (
      <div className="space-y-4">
        <div className="bg-white border rounded-lg overflow-hidden">
          {/* 도구 모음 */}
          <div className="border-b p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="font-semibold text-slate-900">{selectedSheet.name}</h3>
                <p className="text-sm text-slate-500">
                  스프레드시트 편집 중
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={addRow}
              >
                <MoreHorizontal className="h-4 w-4 mr-1" />
                행 추가
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={addColumn}
              >
                <MoreVertical className="h-4 w-4 mr-1" />
                열 추가
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => saveSpreadsheet(selectedSheet)}
              >
                <Save className="h-4 w-4 mr-1" />
                저장
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedSheet(null)}
              >
                목록으로
              </Button>
            </div>
          </div>

          {/* 수식 도움말 */}
          {editingCell && cellInput.startsWith('=') && (
            <div className="border-b p-3 bg-yellow-50">
              <div className="text-sm font-medium text-yellow-800 mb-2">수식 도움말</div>
              <div className="text-xs text-yellow-700 space-y-1">
                <div><code>=SUM(A1:A5)</code> - 범위의 합계</div>
                <div><code>=AVERAGE(A1:A5)</code> - 범위의 평균</div>
                <div><code>=A1+B1</code> - 셀 더하기</div>
                <div><code>=A1*B1</code> - 셀 곱하기</div>
                <div><code>=A1-B1</code> - 셀 빼기</div>
                <div><code>=A1/B1</code> - 셀 나누기</div>
              </div>
            </div>
          )}

          {/* 스프레드시트 그리드 */}
          <div className="overflow-auto max-h-[70vh]">
            <table className="w-full border-collapse">
              {/* 컬럼 헤더 */}
              <thead className="sticky top-0 bg-gray-50 z-10">
                <tr>
                  <th className="w-12 h-8 border bg-gray-100 text-xs font-medium text-gray-600"></th>
                  {Array.from({ length: cols }, (_, colIndex) => (
                    <th
                      key={colIndex}
                      className="min-w-[100px] h-8 border bg-gray-100 text-xs font-medium text-gray-600 px-2 cursor-pointer hover:bg-gray-200"
                      onContextMenu={(e) => showContextMenu(e, 'column', colIndex)}
                    >
                      {getColumnHeader(colIndex)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: rows }, (_, rowIndex) => (
                  <tr key={rowIndex}>
                    {/* 행 번호 */}
                    <td 
                      className="w-12 h-8 border bg-gray-50 text-xs font-medium text-gray-600 text-center cursor-pointer hover:bg-gray-200"
                      onContextMenu={(e) => showContextMenu(e, 'row', rowIndex)}
                    >
                      {rowIndex + 1}
                    </td>
                    {/* 데이터 셀들 */}
                    {Array.from({ length: cols }, (_, colIndex) => {
                      const cellData = selectedSheet.data[rowIndex]?.[colIndex];
                      const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex;
                      
                      return (
                        <td
                          key={colIndex}
                          className={`min-w-[100px] h-8 border p-0 relative group hover:bg-blue-50 ${
                            isEditing ? 'bg-blue-100' : ''
                          }`}
                          onClick={() => startEditingCell(rowIndex, colIndex)}
                        >
                          {isEditing ? (
                            <Input
                              ref={editInputRef}
                              value={cellInput}
                              onChange={(e) => setCellInput(e.target.value)}
                              onKeyDown={handleKeyDown}
                              onBlur={finishEditingCell}
                              className="w-full h-full border-0 rounded-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs bg-transparent"
                            />
                          ) : (
                            <div className="w-full h-full px-2 py-1 text-xs cursor-cell flex items-center">
                              {getCellDisplayValue(cellData)}
                            </div>
                          )}
                          {/* 수식 표시기 */}
                          {cellData?.value.startsWith('=') && !isEditing && (
                            <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full opacity-50"></div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 컨텍스트 메뉴 */}
        {contextMenu.show && (
          <div
            className="fixed bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
            }}
          >
            {contextMenu.type === 'row' && (
              <>
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                  onClick={() => handleContextMenuAction('addRowAbove')}
                >
                  <MoreHorizontal className="h-4 w-4" />
                  위에 행 추가
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                  onClick={() => handleContextMenuAction('addRowBelow')}
                >
                  <MoreHorizontal className="h-4 w-4" />
                  아래에 행 추가
                </button>
                <hr className="my-1" />
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2"
                  onClick={() => handleContextMenuAction('deleteRow')}
                >
                  <Trash2 className="h-4 w-4" />
                  행 삭제
                </button>
              </>
            )}
            {contextMenu.type === 'column' && (
              <>
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                  onClick={() => handleContextMenuAction('addColumnLeft')}
                >
                  <MoreVertical className="h-4 w-4" />
                  왼쪽에 열 추가
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                  onClick={() => handleContextMenuAction('addColumnRight')}
                >
                  <MoreVertical className="h-4 w-4" />
                  오른쪽에 열 추가
                </button>
                <hr className="my-1" />
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2"
                  onClick={() => handleContextMenuAction('deleteColumn')}
                >
                  <Trash2 className="h-4 w-4" />
                  열 삭제
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  // 스프레드시트 목록 화면
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">스프레드시트</h2>
          <p className="text-slate-600 mt-1">팀별 데이터를 관리하고 분석하세요</p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          새 시트 만들기
        </Button>
      </div>

      {/* 새 시트 생성 폼 */}
      {isCreating && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold mb-3">새 스프레드시트 만들기</h3>
          <div className="flex gap-3">
            <Input
              placeholder="스프레드시트 이름을 입력하세요"
              value={newSheetName}
              onChange={(e) => setNewSheetName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  createNewSheet();
                }
              }}
              className="flex-1"
            />
            <Button onClick={createNewSheet} disabled={!newSheetName.trim()}>
              생성
            </Button>
            <Button variant="outline" onClick={() => {
              setIsCreating(false);
              setNewSheetName('');
            }}>
              취소
            </Button>
          </div>
        </div>
      )}

      {/* 스프레드시트 목록 */}
      {spreadsheets.length === 0 ? (
        <div className="text-center py-12">
          <FileSpreadsheet className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">스프레드시트가 없습니다</h3>
          <p className="text-gray-500 mb-4">첫 번째 스프레드시트를 만들어보세요</p>
          <Button
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            새 시트 만들기
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {spreadsheets.map((sheet) => (
            <div
              key={sheet.id}
              className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => setSelectedSheet(sheet)}
            >
              <div className="flex items-start justify-between mb-3">
                <FileSpreadsheet className="h-8 w-8 text-blue-600" />
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSpreadsheet(sheet.id);
                    }}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <h3 className="font-semibold text-slate-900 mb-2">{sheet.name}</h3>
              <p className="text-xs text-slate-500 mb-3">
                최근 수정됨
              </p>
              
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {sheet.data.length}행
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {sheet.team_id ? '팀별' : '공통'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}