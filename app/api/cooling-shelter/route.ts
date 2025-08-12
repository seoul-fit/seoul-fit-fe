import { NextResponse } from "next/server";

export async function GET() {
    try {
        const response = await fetch('http://localhost:8080/api/v1/cooling-shelter/all', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: '무더위 쉼터 데이터를 가져올 수 없습니다.' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('무더위 쉼터 API 에러:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}