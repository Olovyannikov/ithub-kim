import { DataSource } from 'typeorm';

import { dataSourceOptions } from './data-source.options';

/**
 * Единственный экспорт в файле — так требует CLI TypeORM: при нескольких
 * экспортах DataSource он отказывается загружать файл.
 */
export default new DataSource(dataSourceOptions);
