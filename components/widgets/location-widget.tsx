import React from "react";
import Link from "next/link";
import { MapPin, Phone, Mail } from "lucide-react";

interface ILocationWidgetProps {
  id: string;
  widget: {
    id: string;
    title?: string;
    display_options?: {
      location_title?: string;
      location_subtitle?: string;
      address?: string;
      phone?: string;
      email?: string;
      map_url?: string;
      embed_map_url?: string;
    };
  };
  page?: {
    id: string;
    slug: string;
  };
}

export default function LocationWidget({
  id,
  widget,
  page,
}: ILocationWidgetProps) {
  return (
    <section
      id={id}
      className="w-full py-8 md:py-12 px-4"
      // style={{
      //   backgroundColor:
      //     widget?.display_options?.background_color || "transparent",
      // }}
    >
      <div className="container mx-auto">
        <div className="mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            {widget.display_options?.location_title || "위치 정보"}
          </h2>
          <p className="text-gray-600 text-sm">
            {widget.display_options?.location_subtitle ||
              "저희 위치와 연락처 정보입니다"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section - 왼쪽에 지도 표시 */}
          <div className="lg:col-span-2">
            <div className="overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-500 rounded-md w-full h-full">
              {widget.display_options?.embed_map_url ? (
                <iframe
                  src={widget.display_options.embed_map_url}
                  width="100%"
                  height="450"
                  style={{ border: 0 }}
                  allowFullScreen={false}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="위치 지도"
                  className="w-full h-full min-h-[300px]"
                />
              ) : (
                <div className="flex items-center justify-center h-full min-h-[300px] bg-gray-100 text-gray-500">
                  <div className="text-center p-6">
                    <MapPin size={36} className="mx-auto mb-2 text-gray-400" />
                    <p>지도가 설정되지 않았습니다</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 정보 섹션 - 오른쪽에 주소, 전화번호, 이메일 정보 */}
          <div className="lg:col-span-1">
            <div className="overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-500 rounded-md w-full h-full">
              <div className="p-6 bg-white h-full flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-4">연락처 정보</h3>

                  {/* 주소 정보 */}
                  <div className="mb-6">
                    <div className="flex items-start space-x-3">
                      <MapPin
                        className="text-gray-500 mt-1 flex-shrink-0"
                        size={18}
                      />
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">주소</h4>
                        <p className="text-gray-600 whitespace-pre-line">
                          {widget.display_options?.address ||
                            "주소 정보가 없습니다"}
                        </p>
                        {widget.display_options?.map_url && (
                          <a
                            href={widget.display_options.map_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
                          >
                            지도에서 보기 →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 전화번호 정보 */}
                  <div className="mb-6">
                    <div className="flex items-start space-x-3">
                      <Phone
                        className="text-gray-500 mt-1 flex-shrink-0"
                        size={18}
                      />
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">
                          전화번호
                        </h4>
                        {widget.display_options?.phone ? (
                          <a
                            href={`tel:${widget.display_options.phone}`}
                            className="text-gray-600 hover:text-blue-600"
                          >
                            {widget.display_options.phone}
                          </a>
                        ) : (
                          <p className="text-gray-600">
                            전화번호 정보가 없습니다
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 이메일 정보 */}
                  <div className="mb-6">
                    <div className="flex items-start space-x-3">
                      <Mail
                        className="text-gray-500 mt-1 flex-shrink-0"
                        size={18}
                      />
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">
                          이메일
                        </h4>
                        {widget.display_options?.email ? (
                          <a
                            href={`mailto:${widget.display_options.email}`}
                            className="text-gray-600 hover:text-blue-600"
                          >
                            {widget.display_options.email}
                          </a>
                        ) : (
                          <p className="text-gray-600">
                            이메일 정보가 없습니다
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 추가 링크나 CTA 버튼 */}
                {page?.slug && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Link
                      href={`${page.slug}/contact`}
                      className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 w-full"
                    >
                      문의하기
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
