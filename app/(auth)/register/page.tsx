"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/db";
import { toast } from "@/components/ui/toaster";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });

  // 로그인 상태 확인
  useEffect(() => {
    // 로컬 스토리지나 세션 스토리지에서 사용자 정보 확인
    const user = localStorage.getItem("user") || sessionStorage.getItem("user");

    // 이미 로그인된 상태면 홈페이지로 리다이렉트
    if (user) {
      router.push("/");
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (!formData.username.trim()) throw new Error("아이디를 입력하세요");
      if (formData.password !== formData.confirmPassword) {
        throw new Error("비밀번호가 일치하지 않습니다");
      }
      if (!formData.terms) {
        throw new Error("이용약관에 동의해주세요");
      }
      // 아이디 중복 체크
      const { data: existUser, error: existError } = await supabase
        .from("users")
        .select("id")
        .eq("username", formData.username)
        .single();
      if (existUser) throw new Error("이미 사용 중인 아이디입니다");
      
      // 이메일 중복 체크
      const { data: existEmail, error: existEmailError } = await supabase
        .from("users")
        .select("id")
        .eq("email", formData.email)
        .single();
      if (existEmail) throw new Error("이미 사용 중인 이메일입니다");
      
      // Supabase Auth 회원가입
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });
      if (error || !data.user)
        throw new Error(error?.message || "회원가입에 실패했습니다");
      // users 테이블에 username, email 저장
      const { error: userError } = await supabase.from("users").insert({
        id: data.user.id,
        username: formData.username,
        email: formData.email,
      });
      if (userError) throw new Error(userError.message);
      toast({
        title: "회원가입 성공",
        description: "이메일 인증 후 로그인하세요",
        variant: "default",
      });
      router.push("/login");
    } catch (error: any) {
      toast({
        title: "회원가입 실패",
        description: error.message || "회원가입 중 오류가 발생했습니다",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full py-8 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900/30 px-4 sm:px-6 relative ">
      <div className="mx-auto w-full max-w-[450px] bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 sm:p-8 md:p-10">
        <div className="mb-2">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            홈으로 돌아가기
          </Link>
        </div>

        <div className="flex flex-col space-y-2 text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
            회원가입
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
            아래 정보를 입력하여 교회 커뮤니티에 가입하세요
          </p>
        </div>

        <div className="grid gap-6">
          <form onSubmit={handleRegister}>
            <div className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  아이디
                </Label>
                <Input
                  id="username"
                  placeholder="아이디"
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  autoCapitalize="none"
                  autoComplete="username"
                  autoCorrect="off"
                  className="h-11"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  이메일
                </Label>
                <Input
                  id="email"
                  placeholder="이메일 주소"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  className="h-11"
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    비밀번호
                  </Label>
                  <Input
                    id="password"
                    placeholder="••••••••"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    className="h-11"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium"
                  >
                    비밀번호 확인
                  </Label>
                  <Input
                    id="confirmPassword"
                    placeholder="••••••••"
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                    className="h-11"
                    required
                  />
                </div>
              </div>

              <div className="flex items-start space-x-2 mt-2">
                <Checkbox
                  id="terms"
                  name="terms"
                  className="mt-1"
                  checked={formData.terms}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      terms: checked === true,
                    }))
                  }
                  required
                />
                <label
                  htmlFor="terms"
                  className="text-sm text-gray-600 dark:text-gray-300 leading-tight"
                >
                  <span>
                    <Dialog>
                      <DialogTrigger asChild>
                        <button
                          type="button"
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium underline"
                        >
                          이용약관
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogTitle>이용약관</DialogTitle>
                        <DialogDescription asChild>
                          <div className="max-h-[80vh] overflow-y-auto text-left whitespace-pre-wrap">
                            {`커넥트교회 커뮤니티 이용약관

본 방침은 2025년 5월 25일부터 시행됩니다.

제1조 (목적)
이 약관은 커넥트교회 (이하 '교회' 라 합니다.)가 제공하는 인터넷 커뮤니티 서비스 (이하 '서비스' 라 합니다.)의 이용조건 및 절차에 관한 사항, 교회와 이용자의 권리와 의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (약관의 효력과 개정)
2.1 이 약관은 홈페이지를 통하여 이를 공지하거나 전자우편 기타의 방법으로 이용자에게 통지함으로써 효력을 발생합니다.
2.2 교회는 본 약관을 사전 고지 없이 개정할 수 있으며, 개정된 약관은 제9조에 정한 방법으로 공지합니다. 회원은 개정된 약관에 동의하지 아니하는 경우 본인의 회원등록을 취소(회원탈퇴)할 수 있으며, 계속 사용의 경우는 약관 개정에 대한 동의로 간주됩니다. 개정된 약관은 공지와 동시에 그 효력이 발생됩니다.

제3조 (약관이외의 준칙)
이 약관에 명시되어 있지 않은 사항은 관련 법령의 규정에 따릅니다.

제4조 (용어의 정의)
이 약관에서 사용하는 용어의 정의는 다음과 같습니다.
4.1 회원: 서비스에 개인정보를 제공하여 회원등록을 한 자로서, 서비스의 정보를 지속적으로 제공받으며, 이용할 수 있는 자를 말합니다.
4.2 아이디 (ID): 회원 식별과 회원의 서비스 이용을 위하여 회원이 입력한 문자나 숫자 등의 고유체계를 말합니다.
4.3 비밀번호: 회원이 통신상의 자신의 비밀을 보호하기 위해 선정한 문자와 숫자의 조합을 말합니다.
4.4 전자우편 (E-mail): 인터넷을 통한 우편입니다.
4.5 탈퇴: 교회 또는 회원이 서비스 이용 이후 그 이용계약을 종료 시키는 의사표시를 말합니다.
4.6 홈페이지: 교회가 이용자에게 서비스를 제공하기 위하여 컴퓨터 등 정보통신설비를 이용하여 이용자가 열람 및 이용할 수 있도록 설정한 가상의 서비스 공간을 말합니다.
4.7 게시물: 회원이 서비스를 이용하여 게시한 부호·문자·음성·음향·화상·동영상 등의 정보 형태의 글, 사진, 동영상 및 각종 파일과 링크 등을 의미합니다.

제5조 (서비스의 제공 및 변경)
교회가 제공하는 서비스는 다음과 같습니다.
5.1 교회 및 커뮤니티에 대한 정보 제공
5.2 게시판, 댓글 등 커뮤니티 활동 공간 제공
5.3 회원 간의 소통 및 정보 교환 서비스
5.4 기타 교회가 제공하는 각종 정보 및 서비스
5.5 교회는 필요한 경우 서비스의 내용을 추가 또는 변경하여 제공할 수 있습니다.

제6조 (서비스의 중단)
6.1 교회는 컴퓨터 등 정보통신설비의 보수점검/교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다.
6.2 제 1항에 의한 서비스 중단의 경우에는 제 9조에 정한 방법으로 이용자에게 통지합니다.
교회는 제1항의 사유로 서비스의 제공이 일시적으로 중단됨으로 인하여 이용자 또는 제3자가 입은 손해에 대하여 배상하지 아니합니다. 단, 교회에 고의 또는 중과실이 있는 경우에는 그러하지 아니합니다.

제7조 (회원가입)
7.1 이용자는 교회가 정한 가입양식에 따라 회원정보를 기입한 후 이 약관에 동의한다는 의사표시를 함으로서 회원가입을 신청합니다.
7.2 교회는 제 1항과 같이 회원으로 가입할 것을 신청한 이용자 중 다음 각 호에 해당하지 않는 한 회원으로 등록합니다.
7.2.1 이름이 실명이 아닌 경우
7.2.2 등록 내용에 허위, 기재누락, 오기가 있는 경우
7.2.3 타인의 명의를 사용하여 신청한 경우
7.2.4 가입신청자가 이 약관 제 8조 3항에 의하여 이전에 회원자격을 상실한 적이 있는 경우 (단, 제 8조 3항에 의한 회원자격 상실 후 3년이 경과한 자로서 교회의 회원 재가입 승낙을 얻은 경우는 예외로 합니다.)
7.2.5 14세 미만 아동이 법정대리인(부모 등)의 동의를 얻지 아니한 경우
7.2.6 기타 회원으로 교회 소정의 이용신청요건을 충족하지 못하는 경우
7.3 회원가입계약의 성립시기는 회원가입이 완료된 시점으로 합니다.
7.4 회원은 제 10조 1항에 의한 등록사항에 변경이 있는 경우 회원정보변경 항목을 통해 직접 변경사항을 수정, 등록하여야 합니다.

제8조 (회원탈퇴 및 자격 상실 등)
8.1 회원은 언제든지 회원의 탈퇴를 홈페이지에 요청할 수 있으며, 홈페이지는 즉시 이에 응합니다.
8.2 회원이 다음 각 호의 사유에 해당하는 경우, 교회는 회원자격을 제한 및 정지시킬 수 있습니다.
8.2.1 가입 신청 시에 허위 내용을 등록한 경우
8.2.2 타인의 서비스 이용을 방해하거나 그 정보를 도용하는 등 서비스 운영질서를 위협하는 경우
8.2.3 서비스를 이용하여 법령과 이 약관이 금지하거나, 공서양속에 반하는 행위를 하는 경우 (예: 음란물, 폭력적 내용, 특정 종교나 신념 비방, 혐오 표현 등 교회의 목적과 가치에 반하는 행위)
8.2.4 제 13조 에 명기된 회원의 의무사항을 준수하지 못할 경우
8.3 교회가 회원자격을 제한/정지시킨 후, 동일한 행위가 2회 이상 반복되거나 30일 이내에 그 사유가 시정되지 아니하는 경우 교회는 회원자격을 상실 시킬 수 있습니다.
8.4 교회가 회원자격을 상실 시키는 경우 회원에게 이를 통지하고 탈퇴를 처리합니다. 이 경우 회원에게 이를 통지하고, 탈퇴 전에 소명할 기회를 부여합니다.

제9조 (이용자에 대한 통지)
9.1 교회가 이용자에 대한 통지를 하는 경우, 이용자가 가입하신 아이디로 할 수 있습니다.
9.2 불특정 다수 이용자에 대한 통지의 경우 교회는 1주일 이상 서비스 게시판에 게시함으로써 개별 통지에 갈음할 수 있습니다.

제10조 (개인 정보 보호)
10.1 교회는 회원가입을 위한 이용자 정보 수집 시 교회측이 필요한 최소한의 정보를 수집합니다.
다음 사항을 필수사항으로 하며 그 외 사항은 선택사항으로 합니다.
10.1.1 성명 (또는 닉네임)
10.1.2 생년월일 (선택 사항으로 변경 고려)
10.1.3 성별 (선택 사항으로 변경 고려)
10.1.4 아이디 (로그인에 사용되는 고유 식별자)
10.1.5 이메일 (가입 확인, 비밀번호 재설정, 공지 등 필수)
10.1.6 비밀번호
10.1.7 휴대폰번호 (필수 아님, 선택 사항으로 제공하거나 아예 수집하지 않을 수 있음)
10.1.8 본인확인 질문 (일반적인 커뮤니티에서는 잘 사용하지 않음. 필요한 경우에만 유지)
10.2 교회가 이용자의 개인식별이 가능한 개인정보를 수집하는 때에는 반드시 당해 이용자의 동의를 받습니다.
10.3 제공된 개인정보는 당해 이용자의 동의 없이 제 3자에게 제공할 수 없으며, 이에 대한 모든 책임은 교회가 집니다. 다만 다음의 경우에는 예외로 합니다.
10.3.1 커뮤니티 운영상 제3자에게 정보 제공이 필요한 경우 (예: 특정 이벤트 참여 시 동의를 얻어 업체에 정보 제공 등)
10.3.2 통계작성, 학술연구 또는 시장조사를 위하여 필요한 경우로서 특정 개인을 식별할 수 없는 형태로 제공하는 경우
10.3.3 관계법령에 의하여 국가기관으로부터 요구 받은 경우
10.3.4 범죄에 대한 수사상의 목적이 있거나, 정보통신 윤리위원회의 요청이 있는 경우
10.3.5 기타 관계법령에서 정한 절차에 따른 요청이 있는 경우
10.4 이용자는 언제든지 교회가 가지고 있는 자신의 개인정보에 대해 열람 및 오류정정을 할 수 있습니다.
10.5 교회로부터 개인정보를 제공받은 제 3자는 개인정보를 제공받은 목적을 달성한 때에는 당해 개인정보를 지체 없이 파기합니다.

제11조 (교회의 의무)
11.1 교회는 이 약관에서 정한 바에 따라 계속적, 안정적으로 서비스를 제공할 수 있도록 최선의 노력을 다하여야만 합니다.
11.2 교회는 서비스에 관련된 설비를 항상 운용할 수 있는 상태로 유지/보수하고, 장애가 발생하는 경우 지체 없이 이를 수리/복구할 수 있도록 최선의 노력을 다하여야 합니다.
11.3 교회는 이용자가 안전하게 서비스를 이용할 수 있도록 이용자의 개인정보보호를 위한 보안시스템을 갖추어야 합니다.
11.4 교회는 이용자가 원하지 않는 영리목적의 광고성 전자우편을 발송하지 않습니다.

제12조 (회원의 ID 및 비밀번호에 대한 의무)
12.1 회원에게 부여된 아이디(ID)와 비밀번호의 관리책임은 회원에게 있으며 관리 소홀, 부정사용에 의하여 발생하는 모든 결과에 대한 책임은 회원에게 있습니다.
12.2 회원이 자신의 ID 및 비밀번호를 도난 당하거나 제 3자가 사용하고 있음을 인지한 경우에는 바로 교회에 통보하고 교회의 안내가 있는 경우에는 그에 따라야 합니다.

제13조 (회원의 의무)
13.1 회원은 관계법령, 본 약관의 규정, 이용안내 및 주의사항 등 교회가 통지하는 사항을 준수하여야 하며, 기타 교회의 업무에 방해되는 행위를 하여서는 안됩니다.
13.2 회원은 교회의 사전승낙 없이 서비스를 이용하여 어떠한 영리행위도 할 수 없습니다. (예: 개인 쇼핑몰 광고, 다단계 홍보, 특정 상품 판매 유도 등 금지. 단, 교회에서 승인한 공동구매나 비영리적 행사 홍보는 예외로 할 수 있음)
13.3 회원은 서비스를 이용하여 얻은 정보를 교회의 사전승낙 없이 복사, 복제, 변경, 번역, 출판/방송 기타의 방법으로 사용하거나 이를 타인에게 제공할 수 없습니다.
13.4 회원은 자기 신상정보의 변경사항 발생시 즉각 변경하여야 합니다. 회원정보를 수정하지 않아 발생하는 모든 결과에 대한 책임은 회원에게 있습니다.
13.5 회원은 서비스 이용과 관련하여 다음 각 호의 행위를 하지 않아야 하며, 다음 행위를 함으로 발생하는 모든 결과에 대한 책임은 회원에게 있습니다.
13.5.1 다른 회원의 아이디(ID)를 부정하게 사용하는 행위
13.5.2 다른 회원의 E-mail 주소를 취득하여 스팸메일을 발송하는 행위
13.5.3 범죄행위를 목적으로 하거나 기타 범죄행위와 관련된 행위
13.5.4 선량한 풍속, 기타 사회질서를 해하는 행위 (특히 특정 종교, 교단, 개인에 대한 비방 및 비난, 혐오 표현, 정치적/사회적 논쟁 야기, 성적인 내용 등 커뮤니티의 건강한 소통 목적에 부합하지 않는 행위)
13.5.5 교회 및 타인의 명예를 훼손하거나 모욕하는 행위
13.5.6 교회 및 타인의 지적재산권 등의 권리를 침해하는 행위
13.5.7 해킹행위 또는 컴퓨터 바이러스의 유포행위
13.5.8 타인의 의사에 반하여 광고성 정보 등 일정한 내용을 지속적으로 전송하는 행위
13.5.9 서비스의 안정적인 운영에 지장을 주거나 줄 우려가 있는 일체의 행위
13.5.10 교회가 제공하는 서비스의 내용을 변경하는 행위
13.5.11 기타 관계법령에 위배되는 행위

제14조 (게시물 삭제)
14.1 교회는 이용자가 게시하거나 등록하는 서비스내의 게시물이 제 13조의 규정에 위반되거나, 다음 각 호에 해당한다고 판단되는 경우 사전통지 없이 게시물을 삭제할 수 있습니다.
14.1.1 다른 이용자 또는 제 3자를 비방하거나 중상모략으로 명예를 손상시키는 내용
14.1.2 공공질서 또는 미풍양속에 위반되는 내용 (특히 특정 종교, 교단, 개인에 대한 비방 및 비난, 혐오 표현, 정치적/사회적 논쟁 야기 등 커뮤니티의 건강한 소통 목적에 부합하지 않는 내용)
14.1.3 범죄적 행위에 결부된다고 인정되는 내용
14.1.4 제 3자의 저작권 등 기타 권리를 침해하는 내용
14.1.5 서비스의 안정적인 운영에 지장을 주거나 줄 우려가 있는 내용
14.1.6 근거나 확인절차 없이 교회를 비난하거나 유언비어를 유포한 내용
14.1.7 기타 관계법령에 의거하여 위반된다고 판단되는 내용
14.2 교회는 이용자가 게시하거나 등록하는 서비스내의 게시물이 제 13조의 규정에 위반되거나 동 조 제1항 각 호에 해당한다고 판단되는 정보를 링크하고 있을 경우 사전통지 없이 게시물을 삭제할 수 있습니다.

제15조 (게시물에 대한 권리 / 의무)
게시물에 대한 저작권을 포함한 모든 권리 및 책임은 이를 게시한 이용자에게 있습니다.

제16조 (연결 '홈페이지'와 피연결 '홈페이지'간의 관계)
상위 '홈페이지'와 하위 '홈페이지'가 하이퍼 링크(예:하이퍼 링크의 대상에는 문자, 그림 및 동화상 등이 포함됨) 방식 등으로 연결된 경우, 전자를 연결 '홈페이지'라고 하고 후자를 피연결 '홈페이지(웹사이트)'라고 합니다.
연결 '홈페이지'는 피연결 '홈페이지'가 독자적으로 제공하는 재화ㆍ용역에 의하여 이용자와 행하는 거래에 대해서 보증책임을 지지 않습니다.

제17조 (저작권의 귀속 및 이용제한)
17.1 교회가 작성한 저작물에 대한 저작권 및 기타 지적재산권은 교회에 귀속합니다.
17.2 이용자는 서비스를 이용함으로써 얻은 정보를 교회의 사전승낙 없이 복제, 송신, 출판, 배포, 방송, 기타 방법에 의하여 영리목적으로 이용하거나 제 3자에게 이용하게 하여서는 안됩니다.

제18조 (양도금지)
회원이 서비스의 이용권한, 기타 이용 계약상 지위를 타인에게 양도, 증여할 수 없으며, 이를 담보로 제공할 수 없습니다.

제19조 (손해배상)
교회는 무료로 제공되는 서비스와 관련하여 이용자에게 어떠한 손해가 발생하더라도 동 손해가 교회의 중대한 과실에 의한 경우를 제외하고 이에 대하여 책임을 지지 않습니다.

제20조 (면책 / 배상)
20.1 교회는 이용자가 서비스에 게재한 정보, 자료, 사실의 정확성, 신뢰성 등 그 내용에 관하여는 어떠한 책임을 부담하지 아니하고, 이용자는 자신의 책임아래 서비스를 이용하며, 서비스를 이용하여 게시 또는 전송한 자료 등에 관하여 손해가 발생하거나 자료의 취사선택, 기타 서비스 이용과 관련하여 어떠한 불이익이 발생하더라도 이에 대한 모든 책임은 이용자에게 있습니다.
20.2 교회는 제 13조의 규정에 위반하여 이용자간 또는 이용자와 제 3자간에 서비스를 매개로 한 물품거래 등과 관련하여 어떠한 책임도 부담하지 아니하고, 이용자가 서비스의 이용과 관련하여 기대하는 이익에 관하여 책임을 부담하지 않습니다.
20.3 이용자가 제 13조, 기타 이 약관의 규정을 위반함으로 인하여 교회가 이용자 또는 제 3자에 대하여 책임을 부담하게 되고, 이로써 교회에게 손해가 발생하게 되는 경우, 이 약관을 위반한 이용자는 교회에게 발생하는 모든 손해를 배상하여야 하며, 동 손해로부터 교회를 면책시켜야 합니다.

제21조 (분쟁의 해결)
21.1 교회와 이용자는 서비스와 관련하여 발생한 분쟁을 원만하게 해결하기 위하여 필요한 모든 노력을 하여야 합니다.
21.2 제 1항의 규정에도 불구하고, 동 분쟁으로 인하여 소송이 제기될 경우 동 소송은 서울중앙지방법원을 관할로 합니다.
동 소송에는 대한민국 법을 적용합니다.`}
                          </div>
                        </DialogDescription>
                      </DialogContent>
                    </Dialog>
                    과{" "}
                    <Dialog>
                      <DialogTrigger asChild>
                        <button
                          type="button"
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium underline"
                        >
                          개인정보처리방침
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogTitle>개인정보처리방침</DialogTitle>
                        <DialogDescription asChild>
                          <div className="max-h-[80vh] overflow-y-auto text-left whitespace-pre-wrap">
                            {`커넥트교회 개인정보처리방침

본 방침은 2025년 5월 25일부터 시행됩니다.

커넥트교회 (이하 '교회')는 정보통신망 이용촉진 및 정보보호 등에 관한 법률, 개인정보보호법 등 관련 법령상의 개인정보 보호 규정을 준수하며, 이용자의 개인정보 보호에 최선을 다하고 있습니다. 

이 개인정보처리방침은 교회가 제공하는 커뮤니티 서비스(이하 '서비스') 이용과 관련하여 이용자의 개인정보가 어떠한 용도와 방식으로 이용되고 있으며, 개인정보 보호를 위해 교회가 어떠한 조치를 취하고 있는지 알려드립니다.

제1조 (개인정보의 수집 및 이용 목적) 교회는 다음의 목적을 위해 개인정보를 수집 및 이용합니다. 
수집하는 개인정보는 다음 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경될 시에는 사전 동의를 구할 예정입니다.
 1. 회원 가입 및 서비스 제공: 본인 식별/인증, 회원 자격 유지/관리, 서비스 부정이용 방지, 각종 고지/통지, 서비스 제공 및 관련 안내
 2. 커뮤니티 활동 관리: 게시물 등록 및 관리, 댓글 작성, 서비스 이용에 따른 본인확인, 부정이용 방지
 3. 마케팅 및 광고에 활용 (선택 동의 시): 신규 서비스(제품) 개발 및 특화, 이벤트 등 광고성 정보 전달, 접속 빈도 파악 또는 회원의 서비스 이용에 대한 통계
 4. 민원 처리: 불만 처리, 고충 처리, 분쟁 조정을 위한 기록 보존

제2조 (수집하는 개인정보 항목 및 수집 방법) 교회는 서비스 제공을 위해 최소한의 개인정보만을 수집하며, 이용자의 동의를 얻어 수집합니다.
1. 수집하는 개인정보 항목:
    * 필수 항목: 아이디, 비밀번호, 닉네임 (또는 이름), 이메일 주소
    * 선택 항목: 생년월일, 성별, 휴대폰 번호, 본인확인 질문 및 답변
    * 서비스 이용 과정에서 자동 생성 및 수집될 수 있는 항목: IP 주소, 서비스 이용 기록, 접속 로그, 쿠키, MAC 주소, 모바일 기기 정보 (OS 버전, 모델명), 불량 이용 기록
2. 개인정보 수집 방법:
    * 회원가입, 게시물 작성, 이벤트 참여 등 서비스 이용 과정에서 이용자가 개인정보를 직접 입력하는 방식
    * 서비스 이용 중 자동 생성 및 수집되는 방식 (쿠키 등)
    * 오프라인 채널(행사 참여 등)을 통한 서면 양식 제출 방식 (필요시)

제3조 (개인정보의 보유 및 이용 기간) 교회는 원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 
단, 다음의 정보에 대해서는 아래 명시된 기간 동안 보존합니다.
1. 교회 내부 방침에 의한 정보 보유:
    * 부정 이용 기록: 1년 (부정 이용 재발 방지)
2. 관련 법령에 의한 정보 보유:
    * 계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래 등에서의 소비자보호에 관한 법률)
    * 대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래 등에서의 소비자보호에 관한 법률)
    * 소비자의 불만 또는 분쟁 처리에 관한 기록: 3년 (전자상거래 등에서의 소비자보호에 관한 법률)
    * 통신비밀보호법에 따른 통신사실확인자료: 3개월 (로그인 기록 등)
    * 기타 법령에 따라 보존이 필요한 개인정보

제4조 (개인정보의 파기 절차 및 방법) 교회는 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 다음과 같은 절차 및 방법으로 지체 없이 파기합니다.
1. 파기 절차:
    * 이용자가 회원가입 등을 위해 입력한 정보는 목적이 달성된 후 별도의 데이터베이스로 옮겨져(종이의 경우 별도의 서류함) 내부 방침 및 기타 관련 법령에 의한 정보보호 사유에 따라 일정 기간 저장된 후 파기됩니다.
    * 별도 DB로 옮겨진 개인정보는 법률에 의한 경우가 아니고서는 보유되는 이외의 다른 목적으로 이용되지 않습니다.
2. 파기 방법:
    * 전자적 파일 형태로 저장된 개인정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제합니다.
    * 종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각하여 파기합니다.
제5조 (개인정보의 제3자 제공) 교회는 이용자의 개인정보를 제1조(개인정보의 수집 및 이용 목적)에서 명시한 범위를 초과하여 이용하거나 타인 또는 타 기업/기관에 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다.
1. 이용자가 사전에 동의한 경우
2. 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우

6조 (개인정보 처리 위탁) 교회는 서비스 향상을 위해 개인정보 처리 업무를 외부에 위탁할 수 있습니다. 위탁 시에는 개인정보보호 관계 법령을 준수하고, 수탁자들이 개인정보를 안전하게 처리하는지 감독하며, 위탁업무 내용 및 수탁자를 홈페이지 또는 본 방침에 공개합니다.

제7조 (이용자 및 법정대리인의 권리 행사 방법) 이용자 및 법정대리인은 언제든지 등록되어 있는 자신 또는 당해 만 14세 미만 아동의 개인정보를 조회하거나 수정할 수 있으며, 가입 해지(동의 철회)를 요청할 수도 있습니다.
 1. 개인정보 조회/수정을 위해서는 서비스 내 '회원정보 수정' 기능을 이용하시거나, 개인정보 보호책임자에게 서면, 전화, 이메일로 연락하시면 지체 없이 조치하겠습니다.
 2. 가입 해지(동의 철회)를 위해서는 서비스 내 '회원탈퇴' 기능을 이용하시거나, 개인정보 보호책임자에게 서면, 전화, 이메일로 연락하시면 지체 없이 개인정보 파기 등 필요한 조치를 하겠습니다.
 3. 이용자가 개인정보의 오류에 대한 정정을 요청한 경우, 정정을 완료하기 전까지 당해 개인정보를 이용하거나 제공하지 않습니다. 또한 잘못된 개인정보를 제3자에게 이미 제공한 경우에는 정정 처리결과를 제3자에게 지체 없이 통지하여 정정이 이루어지도록 하겠습니다.

제8조 (개인정보 자동 수집 장치의 설치/운영 및 거부) 교회는 이용자에게 개인형 서비스를 제공하기 위해 이용정보를 저장하고 수시로 불러오는 '쿠키(cookie)'를 사용합니다.
1. 쿠키의 정의: 쿠키는 웹사이트를 운영하는데 이용되는 서버가 이용자의 컴퓨터 브라우저에 보내는 아주 작은 텍스트 파일로서 이용자의 컴퓨터 하드디스크에 저장됩니다.
2. 쿠키 사용 목적: 이용자가 방문한 각 서비스와 웹 사이트들에 대한 방문 및 이용형태, 인기 검색어, 보안접속 여부, 뉴스 열람 등을 파악하여 이용자에게 최적화된 정보 제공을 위해 사용됩니다.
3. 쿠키 설치/운영 및 거부:
    * 이용자는 쿠키 설치에 대한 선택권을 가지고 있습니다. 따라서, 이용자는 웹 브라우저에서 옵션을 설정함으로써 모든 쿠키를 허용하거나, 쿠키가 저장될 때마다 확인을 거치거나, 아니면 모든 쿠키의 저장을 거부할 수도 있습니다.
    * 설정 방법 예 (Internet Explorer의 경우): 웹 브라우저 상단의 도구 > 인터넷 옵션 > 개인정보 탭 > 개인정보취급 수준 설정
    * 단, 쿠키 저장을 거부할 경우 일부 서비스 이용에 어려움이 있을 수 있습니다.

제9조 (개인정보 보호책임자 및 담당 부서) 교회는 이용자의 개인정보를 보호하고 개인정보와 관련한 불만을 처리하기 위하여 아래와 같이 개인정보 보호책임자 및 담당 부서를 지정하고 있습니다.
* 개인정보 보호책임자:
    * 성명: [교회 담당자 이름] 책책: [담당자의 직책] 연락처: [전화번호], [이메일 주소] (교회 대표 연락처 또는 담당자 직통 연락처)
* 개인정보 보호 담당 부서:
    * 부서명: [담당 부서명] 연락처: [전화번호], [이메일 주소]
기타 개인정보 침해에 대한 상담이 필요하신 경우에는 아래 기관에 문의하시기 바랍니다.
* 개인정보침해신고센터 (privacy.kisa.or.kr / 국번없이 118)
* 대검찰청 사이버수사과 (www.spo.go.kr / 국번없이 1301)
* 경찰청 사이버안전국 (cyberbureau.police.go.kr / 국번없이 182)

제10조 (개인정보처리방침 변경) 이 개인정보처리방침은 법령 및 방침에 따른 변경 내용 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 웹사이트 공지사항을 통하여 고지할 것입니다. 다만, 개인정보의 수집 및 활용, 제3자 제공 등 이용자 권리의 중요한 변경이 있을 경우에는 최소 30일 전에 고지합니다.
`}
                          </div>
                        </DialogDescription>
                      </DialogContent>
                    </Dialog>
                    에 동의합니다
                  </span>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full h-11 mt-2 text-base"
                disabled={isLoading}
              >
                {isLoading ? "처리 중..." : "회원가입"}
              </Button>
            </div>
          </form>

          <div className="text-center text-sm pt-4 border-t border-gray-200 dark:border-gray-700 mt-2">
            이미 계정이 있으신가요?{" "}
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              로그인
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
