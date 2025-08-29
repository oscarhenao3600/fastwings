exports.up = function(knex) {
  return knex.schema.createTable('orders', function(table) {
    table.increments('id').primary();
    table.integer('branch_id').unsigned().references('id').inTable('branches').onDelete('CASCADE');
    table.string('customer_name').notNullable();
    table.string('customer_phone').notNullable();
    table.text('items').notNullable(); // JSON string de los items
    table.decimal('total_amount', 10, 2).notNullable();
    table.enum('status', ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']).defaultTo('pending');
    table.text('notes');
    table.string('payment_proof_path'); // Ruta del comprobante de pago
    table.string('invoice_path'); // Ruta de la factura generada
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('orders');
};
