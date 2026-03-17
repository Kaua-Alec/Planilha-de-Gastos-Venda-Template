import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Map snake_case from DB to camelCase for frontend
    const mappedGoals = data.map(goal => ({
        id: goal.id,
        name: goal.name,
        targetAmount: goal.target_amount,
        currentAmount: goal.current_amount,
        deadline: goal.deadline,
        status: goal.status || 'active',
        created_at: goal.created_at
    }))

    return NextResponse.json(mappedGoals)
}

export async function POST(request: Request) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Map camelCase from frontend to snake_case for DB
    const dbPayload = {
        user_id: user.id,
        name: body.name,
        target_amount: body.targetAmount,
        current_amount: body.currentAmount,
        deadline: body.deadline,
        status: body.status || 'active'
    }

    const { data, error } = await supabase
        .from('goals')
        .insert([dbPayload])
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Map back to camelCase for response
    const mappedResponse = {
        id: data.id,
        name: data.name,
        targetAmount: data.target_amount,
        currentAmount: data.current_amount,
        deadline: data.deadline,
        status: data.status
    }

    return NextResponse.json(mappedResponse)
}

export async function PUT(request: Request) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    // Map camelCase to snake_case for update
    const dbPayload: any = {}
    if (updateData.name !== undefined) dbPayload.name = updateData.name
    if (updateData.targetAmount !== undefined) dbPayload.target_amount = updateData.targetAmount
    if (updateData.currentAmount !== undefined) dbPayload.current_amount = updateData.currentAmount
    if (updateData.deadline !== undefined) dbPayload.deadline = updateData.deadline
    if (updateData.status !== undefined) dbPayload.status = updateData.status

    const { data, error } = await supabase
        .from('goals')
        .update(dbPayload)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Map back to camelCase for response
    const mappedResponse = {
        id: data.id,
        name: data.name,
        targetAmount: data.target_amount,
        currentAmount: data.current_amount,
        deadline: data.deadline,
        status: data.status
    }

    return NextResponse.json(mappedResponse)
}

export async function DELETE(request: Request) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
        return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
