exports.up = function(knex) {
  return knex.schema.createTable('branches', function(table) {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.text('address');
    table.string('phone');
    table.string('logo_path');
    table.string('order_number').unique(); // Número de WhatsApp para la sucursal
    table.string('system_number'); // Número del sistema
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('branches');
};
