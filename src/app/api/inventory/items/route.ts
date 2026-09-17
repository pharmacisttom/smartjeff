import { NextResponse } from "next/server";
import { ItemService } from "@/server/services/inventory/item.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId") || undefined;
    const itemType = searchParams.get("itemType") || undefined;
    const search = searchParams.get("search") || undefined;

    const items = await ItemService.getItems({ categoryId, itemType, search });
    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const item = await ItemService.createItem(body);
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
