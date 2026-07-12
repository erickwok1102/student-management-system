/**
 * 建立學員（生成 Y0001 格式 ID，撞號自動重試）
 * 俾 /api/students（管理員新增）同 /api/register（家長自助登記）共用
 */
export async function insertStudentWithGeneratedId(supabase, student) {
    let lastError = null;

    for (let attempt = 0; attempt < 3; attempt++) {
        const { data: ids, error: idError } = await supabase
            .from('students')
            .select('id')
            .like('id', 'Y%');

        if (idError) throw idError;

        const maxNum = ids
            .map(row => parseInt(row.id.substring(1), 10))
            .filter(num => !isNaN(num))
            .reduce((max, num) => Math.max(max, num), 0);

        const newId = `Y${String(maxNum + 1).padStart(4, '0')}`;

        const { data, error } = await supabase
            .from('students')
            .insert({ ...student, id: newId })
            .select()
            .single();

        if (!error) return data;
        if (error.code !== '23505') throw error; // 唔係撞 ID 就直接報錯
        lastError = error;
    }

    throw lastError || new Error('新增學員失敗');
}
