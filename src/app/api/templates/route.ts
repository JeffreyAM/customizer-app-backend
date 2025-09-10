import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import axios from 'axios';
const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

/**
 * @openapi
 * combination parameters use 
 * customer_id and templateId for checking if user access this template is allowed
 * customer_id fetch template data using shopify customer id
 * userId fetch template data using backend userId
 * /api/templates:
 *   get:
 *     summary: Get a list of templates
 *     tags: ["Internal"]
 *     parameters:
 *       - in: query
 *         name: userId, customer_id , templateId
 *         required: false
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         required: false
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: A list of templates
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */

export async function GET(req: NextRequest) {
  try {
    let userId;
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get('userId');
    const customerId = searchParams.get('customer_id');
    const templateId = searchParams.get('templateId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!user_id && !customerId) {
      return NextResponse.json(
        { error: 'User ID or Customer ID is required' },
        { status: 400 }
      );
    }
    if (user_id) {
      userId = user_id;
    }

    if (customerId){
      const user = await axios.get(
      `${NEXT_PUBLIC_BASE_URL}/api/users?customer_id=${customerId}`
      );
      const id = user.data?.user?.id;
      userId = id;
    }
    let query = supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (templateId) {
      query = query.eq('template_id', templateId);
    }

    const { data: templates, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch templates', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      templates,
      count: templates?.length || 0,
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Server error', details: error.message },
      { status: 500 }
    );
  }
}