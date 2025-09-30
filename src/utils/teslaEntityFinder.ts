// Utility to find Tesla solar entities in Home Assistant
interface TeslaSolarData {
  powerGenerated: number;
  powerConsumed: number;
  powerExported: number;
  status: "generating" | "storing" | "exporting" | "unavailable";
  powerwallCharging: boolean;
  powerwallCharge: number; // percentage
}

// Helper function to check if an entity matches load power patterns
function isLoadPowerEntity(entityId: string, friendlyName: string): boolean {
  const id = entityId.toLowerCase();
  const name = friendlyName.toLowerCase();

  const loadPatterns = [
    'load_power',
    'load_instant',
    'home_power',
    'house_power',
    'consumed',
    'consumption',
    'usage'
  ];

  return loadPatterns.some(pattern =>
    id.includes(pattern) || name.includes(pattern)
  ) || (
    (id.includes('load') || name.includes('load')) &&
    (id.includes('power') || name.includes('power') || id.includes('instant'))
  );
}

interface HAEntity {
  entity_id: string;
  state: string;
  attributes: {
    friendly_name?: string;
    device_class?: string;
    unit_of_measurement?: string;
    [key: string]: unknown;
  };
}

export async function findTeslaSolarEntities(credentials: { url: string; token: string }): Promise<{
  entities: HAEntity[];
  solarData: TeslaSolarData;
}> {
  try {
    const response = await fetch(`${credentials.url}/api/states`, {
      headers: {
        'Authorization': `Bearer ${credentials.token}`,
        'Content-Type': 'application/json',
      },
      mode: 'cors',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const haEntities: HAEntity[] = await response.json();

    // Search for Tesla-related entities - focusing on user's "my_home" entities
    const teslaEntities = haEntities.filter(entity => {
      const entityId = entity.entity_id.toLowerCase();
      const friendlyName = (entity.attributes.friendly_name || '').toLowerCase();

      return (
        // Specific sensor for consumed data
        entityId === 'sensor.my_home_site_import' ||

        // Primary filter: All "my_home" entities (user's Tesla/Solar system)
        entityId.includes('my_home') ||
        friendlyName.includes('my_home') ||

        // Backup Tesla/Powerwall specific patterns
        entityId.includes('tesla') ||
        entityId.includes('powerwall') ||
        friendlyName.includes('tesla') ||
        friendlyName.includes('powerwall') ||

        // Solar/PV specific
        entityId.includes('solar') ||
        entityId.includes('pv') ||
        friendlyName.includes('solar') ||
        friendlyName.includes('pv')
      );
    });

    console.log('Tesla/Solar/Energy entities found:', teslaEntities.length, 'entities');

    // Debug: Show all found entities
    teslaEntities.forEach(entity => {
      const state = parseFloat(entity.state) || 0;
      console.log(`Entity: ${entity.entity_id} | Name: "${entity.attributes.friendly_name}" | State: "${entity.state}" | Numeric: ${state} | Unit: ${entity.attributes.unit_of_measurement || 'none'}`);
    });

    // Extra debug: Show any entities that contain "charge" that might have been missed
    console.log('🔍 ALL entities containing "charge":');
    haEntities
      .filter(entity =>
        entity.entity_id.toLowerCase().includes('charge') ||
        (entity.attributes.friendly_name || '').toLowerCase().includes('charge')
      )
      .forEach(entity => {
        console.log(`  CHARGE Entity: ${entity.entity_id} | Name: "${entity.attributes.friendly_name}" | State: "${entity.state}" | Unit: ${entity.attributes.unit_of_measurement || 'none'}`);
      });

    // Additional comprehensive debug for charging-related entities
    console.log('🔍 ALL entities containing "battery", "powerwall", "tesla":');
    haEntities
      .filter(entity => {
        const entityId = entity.entity_id.toLowerCase();
        const friendlyName = (entity.attributes.friendly_name || '').toLowerCase();
        return entityId.includes('battery') || entityId.includes('powerwall') || entityId.includes('tesla') ||
               friendlyName.includes('battery') || friendlyName.includes('powerwall') || friendlyName.includes('tesla');
      })
      .forEach(entity => {
        console.log(`  TESLA/BATTERY Entity: ${entity.entity_id} | Name: "${entity.attributes.friendly_name}" | State: "${entity.state}" | Unit: ${entity.attributes.unit_of_measurement || 'none'}`);
      });

    // Show grid/power entities that might indicate charging
    console.log('🔍 ALL entities containing "grid" or "energy":');
    haEntities
      .filter(entity => {
        const entityId = entity.entity_id.toLowerCase();
        const friendlyName = (entity.attributes.friendly_name || '').toLowerCase();
        return entityId.includes('grid') || entityId.includes('energy') ||
               friendlyName.includes('grid') || friendlyName.includes('energy');
      })
      .slice(0, 20) // Limit to first 20 to avoid spam
      .forEach(entity => {
        console.log(`  GRID/ENERGY Entity: ${entity.entity_id} | Name: "${entity.attributes.friendly_name}" | State: "${entity.state}" | Unit: ${entity.attributes.unit_of_measurement || 'none'}`);
      });

    // Try to identify specific power metrics
    let powerGenerated = 0;
    let powerConsumed = 0;
    let powerExported = 0;
    let powerwallCharging = false;
    let powerwallCharge = 0;
    let status: TeslaSolarData['status'] = 'unavailable';

    // Look for specific patterns in entity IDs and friendly names
    teslaEntities.forEach(entity => {
      const entityId = entity.entity_id.toLowerCase();
      const friendlyName = (entity.attributes.friendly_name || '').toLowerCase();
      const state = parseFloat(entity.state) || 0;

      // Skip entities with invalid states
      if (isNaN(state) || entity.state === 'unavailable' || entity.state === 'unknown') {
        return;
      }

      // Generated power patterns (solar generation)
      if (
        entityId === 'sensor.powerwall_my_home_total_generated_daily' ||
        entityId.includes('total_generated') ||
        entityId.includes('solar_power') ||
        entityId.includes('pv_power') ||
        entityId.includes('solar') && (entityId.includes('power') || entityId.includes('generation')) ||
        entityId.includes('generated') ||
        friendlyName.includes('total generated') ||
        friendlyName.includes('solar power') ||
        friendlyName.includes('solar generation') ||
        friendlyName.includes('generated') ||
        friendlyName.includes('pv power') ||
        (friendlyName.includes('solar') && friendlyName.includes('power'))
      ) {
        console.log(`✅ Found GENERATED power: ${entity.entity_id} = ${state}W/kW`);
        powerGenerated = Math.max(powerGenerated, state);
      }

      // Consumed power patterns - prioritize specific sensor first
      if (entityId === 'sensor.powerwall_my_home_total_home_consumed_daily' ||
          entityId === 'sensor.my_home_site_import') {
        console.log(`✅ Found CONSUMED power: ${entity.entity_id} = ${state}W/kW`);
        powerConsumed = state;
      } else if ((entityId.includes('total_home_consumed') ||
                  entityId.includes('home_consumed') ||
                  friendlyName.includes('total home consumed') ||
                  friendlyName.includes('home consumed')) && powerConsumed === 0) {
        console.log(`✅ Found CONSUMED power (pattern match): ${entity.entity_id} = ${state}W/kW`);
        powerConsumed = state;
      } else if (isLoadPowerEntity(entityId, friendlyName) && powerConsumed === 0) {
        // Only use fallback patterns if we haven't found the specific sensor
        console.log(`✅ Found CONSUMED power (fallback): ${entity.entity_id} = ${state}W/kW`);
        powerConsumed = Math.max(powerConsumed, state);
      }

      // Exported power patterns (to grid)
      if (
        entityId === 'sensor.powerwall_my_home_total_to_grid_daily' ||
        entityId.includes('total_to_grid') ||
        entityId.includes('to_grid') ||
        entityId.includes('grid_power') ||
        entityId.includes('grid') && (entityId.includes('power') || entityId.includes('export')) ||
        entityId.includes('export') ||
        entityId.includes('sold') ||
        entityId.includes('feed') ||
        friendlyName.includes('total to grid') ||
        friendlyName.includes('to grid') ||
        friendlyName.includes('grid power') ||
        friendlyName.includes('grid export') ||
        (friendlyName.includes('grid') && friendlyName.includes('power')) ||
        friendlyName.includes('export') ||
        friendlyName.includes('sold') ||
        friendlyName.includes('feed')
      ) {
        console.log(`✅ Found EXPORTED power: ${entity.entity_id} = ${state}W/kW`);
        powerExported = Math.max(powerExported, Math.abs(state)); // Absolute value in case it's negative
      }

      // Powerwall charging status (boolean entities) - enhanced detection
      if (
        // Specific entity for user's system
        entityId === 'binary_sensor.my_home_charging' ||

        // Direct powerwall + charging patterns
        (entityId.includes('powerwall') && (entityId.includes('charging') || entityId.includes('charge'))) ||
        (entityId.includes('battery') && (entityId.includes('charging') || entityId.includes('charge'))) ||
        (friendlyName.includes('powerwall') && (friendlyName.includes('charging') || friendlyName.includes('charge'))) ||
        (friendlyName.includes('battery') && (friendlyName.includes('charging') || friendlyName.includes('charge'))) ||

        // Tesla-specific charging patterns
        (entityId.includes('tesla') && (entityId.includes('charging') || entityId.includes('charge'))) ||
        (friendlyName.includes('tesla') && (friendlyName.includes('charging') || friendlyName.includes('charge'))) ||

        // More specific charging patterns
        entityId.includes('charge_state') ||
        entityId.includes('charging_state') ||
        entityId.includes('is_charging') ||
        friendlyName.includes('charge state') ||
        friendlyName.includes('charging state') ||
        friendlyName.includes('is charging') ||

        // Binary sensor patterns for charging
        (entityId.startsWith('binary_sensor.') && (
          entityId.includes('charging') || entityId.includes('charge') ||
          friendlyName.includes('charging') || friendlyName.includes('charge')
        )) ||

        // Switch patterns for charging
        (entityId.startsWith('switch.') && (
          entityId.includes('charging') || entityId.includes('charge') ||
          friendlyName.includes('charging') || friendlyName.includes('charge')
        )) ||

        // Sensor patterns for charging status
        (entityId.startsWith('sensor.') && (
          entityId.includes('charging') || entityId.includes('charge') ||
          friendlyName.includes('charging') || friendlyName.includes('charge')
        ) && (entity.state === 'on' || entity.state === 'off' || entity.state === 'true' || entity.state === 'false')) ||

        // Power flow direction indicators (negative grid power often means charging)
        (entityId.includes('grid') && entityId.includes('power') && state < 0) ||
        (friendlyName.includes('grid') && friendlyName.includes('power') && state < 0)
      ) {
        console.log(`🔍 Checking charging entity: ${entity.entity_id} = "${entity.state}" (${typeof entity.state})`);

        // Check various charging state formats
        if (
          entity.state === 'on' ||
          entity.state === 'true' ||
          entity.state === 'charging' ||
          entity.state === 'Charging' ||
          entity.state === 'CHARGING' ||
          entity.state === '1' ||
          (typeof entity.state === 'string' && entity.state.toLowerCase().includes('charg'))
        ) {
          powerwallCharging = true;
          console.log(`✅ Found POWERWALL CHARGING: ${entity.entity_id} = ${entity.state}`);
        } else if (
          entity.state === 'off' ||
          entity.state === 'false' ||
          entity.state === 'not_charging' ||
          entity.state === 'Not Charging' ||
          entity.state === 'idle' ||
          entity.state === 'Idle' ||
          entity.state === '0'
        ) {
          console.log(`✅ Found POWERWALL NOT CHARGING: ${entity.entity_id} = ${entity.state}`);
        } else {
          console.log(`⚠️ Unknown charging state: ${entity.entity_id} = "${entity.state}"`);
        }
      }

      // Powerwall charge level (percentage) - enhanced detection
      if (
        // Specific entity for user's charge level
        entityId === 'sensor.my_home_charge' ||

        // Direct powerwall/battery + charge/level/soc patterns
        (entityId.includes('powerwall') || entityId.includes('battery')) &&
        (entityId.includes('charge') || entityId.includes('level') || entityId.includes('soc') || entityId.includes('percent')) ||
        (friendlyName.includes('powerwall') || friendlyName.includes('battery')) &&
        (friendlyName.includes('charge') || friendlyName.includes('level') || friendlyName.includes('soc') || friendlyName.includes('percent')) ||

        // More specific patterns
        entityId.includes('charge_level') ||
        entityId.includes('battery_level') ||
        entityId.includes('state_of_charge') ||
        friendlyName.includes('charge level') ||
        friendlyName.includes('battery level') ||
        friendlyName.includes('state of charge') ||

        // Tesla-specific patterns
        (entityId.includes('tesla') && (entityId.includes('charge') || entityId.includes('soc'))) ||
        (friendlyName.includes('tesla') && (friendlyName.includes('charge') || friendlyName.includes('soc'))) ||

        // My_home charge patterns
        (entityId.includes('my_home') && entityId.includes('charge') && !entityId.includes('charging'))
      ) {
        // Check for percentage values (including entities that might report 0-1 as decimals)
        if (state >= 0 && state <= 100) {
          powerwallCharge = Math.max(powerwallCharge, state);
          console.log(`✅ Found POWERWALL CHARGE: ${entity.entity_id} = ${state}% (Unit: ${entity.attributes.unit_of_measurement || 'none'})`);
        } else if (state >= 0 && state <= 1 && entity.attributes.unit_of_measurement !== 'W' && entity.attributes.unit_of_measurement !== 'kW') {
          // Handle decimal percentage (0.75 = 75%)
          const percentage = state * 100;
          powerwallCharge = Math.max(powerwallCharge, percentage);
          console.log(`✅ Found POWERWALL CHARGE (decimal): ${entity.entity_id} = ${percentage}% (from ${state})`);
        }
      }
    });

    console.log(`Final values: Generated=${powerGenerated}, Consumed=${powerConsumed}, Exported=${powerExported}, Charging=${powerwallCharging}, Charge=${powerwallCharge}%`);

    // Determine status
    if (powerGenerated > 0) {
      if (powerGenerated > powerConsumed) {
        status = 'exporting';
      } else {
        status = 'generating';
      }
    } else {
      status = 'unavailable';
    }

    return {
      entities: teslaEntities,
      solarData: {
        powerGenerated,
        powerConsumed,
        powerExported,
        status,
        powerwallCharging,
        powerwallCharge
      }
    };

  } catch (error) {
    console.error('Failed to find Tesla solar entities:', error);
    return {
      entities: [],
      solarData: {
        powerGenerated: 0,
        powerConsumed: 0,
        powerExported: 0,
        status: 'unavailable',
        powerwallCharging: false,
        powerwallCharge: 0
      }
    };
  }
}