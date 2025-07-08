"use client";

import React, { useState, useRef, useEffect, forwardRef } from "react";
import { X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { ITag } from "@/types/index";

interface TagInputProps {
  value: ITag[];
  onChange: (tags: ITag[]) => void;
  placeholder?: string;
  maxTags?: number;
  allowCreate?: boolean;
  className?: string;
}

export const TagInput = forwardRef<HTMLInputElement, TagInputProps>(
  ({ value = [], onChange, placeholder = "태그를 선택하세요...", maxTags = 10, allowCreate = true, className }, ref) => {
    const [inputValue, setInputValue] = useState("");
    const [suggestions, setSuggestions] = useState<ITag[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    // 태그 검색
    useEffect(() => {
      const searchTags = async () => {
        if (inputValue.length < 1) {
          setSuggestions([]);
          setShowSuggestions(false);
          return;
        }

        setIsLoading(true);
        try {
          const { data, error } = await supabase
            .from("tags")
            .select("*")
            .eq("is_active", true)
            .ilike("name", `%${inputValue}%`)
            .limit(10);

          if (!error && data) {
            // 이미 선택된 태그는 제외
            const filteredSuggestions = data.filter(
              (tag: ITag) => !value.some((selectedTag) => selectedTag.id === tag.id)
            );
            setSuggestions(filteredSuggestions);
            setShowSuggestions(true);
          }
        } catch (error) {
          console.error("태그 검색 실패:", error);
        } finally {
          setIsLoading(false);
        }
      };

      const debounceTimer = setTimeout(searchTags, 300);
      return () => clearTimeout(debounceTimer);
    }, [inputValue, value, supabase]);

    // 태그 추가
    const addTag = async (tag?: ITag) => {
      if (value.length >= maxTags) {
        alert(`최대 ${maxTags}개의 태그만 추가할 수 있습니다.`);
        return;
      }

      let tagToAdd = tag;

      // 새 태그 생성
      if (!tagToAdd && inputValue.trim() && allowCreate) {
        const tagName = inputValue.trim();
        const slug = tagName.toLowerCase().replace(/\s+/g, "-");

        try {
          const { data, error } = await supabase
            .from("tags")
            .insert({
              name: tagName,
              slug: slug,
              color: "#6B7280", // 기본 회색
              is_active: true,
            })
            .select()
            .single();

          if (!error && data) {
            tagToAdd = data;
          } else {
            console.error("태그 생성 실패:", error);
            return;
          }
        } catch (error) {
          console.error("태그 생성 실패:", error);
          return;
        }
      }

      if (tagToAdd && !value.some((t) => t.id === tagToAdd!.id)) {
        onChange([...value, tagToAdd]);
        setInputValue("");
        setShowSuggestions(false);
      }
    };

    // 태그 제거
    const removeTag = (tagId: string) => {
      onChange(value.filter((tag) => tag.id !== tagId));
    };

    // 키보드 이벤트 처리
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (suggestions.length > 0) {
          addTag(suggestions[0]);
        } else if (allowCreate && inputValue.trim()) {
          addTag();
        }
      } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
        removeTag(value[value.length - 1].id);
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
      }
    };

    return (
      <div className={`relative ${className}`}>
        {/* 선택된 태그들 */}
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="px-2 py-1 text-sm"
              style={{ backgroundColor: tag.color + "20", color: tag.color, borderColor: tag.color }}
            >
              {tag.name}
              <button
                type="button"
                onClick={() => removeTag(tag.id)}
                className="ml-1 text-gray-500 hover:text-gray-700"
              >
                <X size={12} />
              </button>
            </Badge>
          ))}
        </div>

        {/* 입력 필드 */}
        <div className="relative">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => inputValue && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder={value.length >= maxTags ? `최대 ${maxTags}개` : placeholder}
            disabled={value.length >= maxTags}
            className="w-full"
          />

          {/* 추가 버튼 */}
          {allowCreate && inputValue.trim() && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => addTag()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 px-2"
            >
              <Plus size={14} />
            </Button>
          )}
        </div>

        {/* 자동완성 드롭다운 */}
        {showSuggestions && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
            {isLoading ? (
              <div className="p-2 text-sm text-gray-500">검색 중...</div>
            ) : suggestions.length > 0 ? (
              suggestions.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => addTag(tag)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                  {tag.description && (
                    <span className="text-gray-500 text-xs">- {tag.description}</span>
                  )}
                </button>
              ))
            ) : allowCreate && inputValue.trim() ? (
              <button
                type="button"
                onClick={() => addTag()}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 text-blue-600"
              >
                <Plus size={14} className="inline mr-2" />
                "{inputValue}" 태그 생성
              </button>
            ) : (
              <div className="p-2 text-sm text-gray-500">검색 결과가 없습니다.</div>
            )}
          </div>
        )}

        {/* 태그 개수 표시 */}
        <div className="mt-1 text-xs text-gray-500 text-right">
          {value.length}/{maxTags}
        </div>
      </div>
    );
  }
);

TagInput.displayName = "TagInput";