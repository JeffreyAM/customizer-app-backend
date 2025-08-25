import { supabase } from "@/lib/supabase"; 
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const templateId = params.id;

  if (!templateId) {
    return NextResponse.json({ error: 'Missing template ID' }, { status: 400 });
  }

  try {
    const { data: template, error } = await supabase
      .from('templates')
      .select('*')
      .eq('template_id', templateId)
      .maybeSingle();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
    }

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ template }, { status: 200 });
  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
