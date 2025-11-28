library ieee;
use ieee.std_logic_1164.all;

entity vhdl_moore_fsm_sequence_detector is
    port (
        clock : in std_logic;
        reset : in std_logic;
        sequence_in : in std_logic;
        detector_out : out std_logic
    );
end vhdl_moore_fsm_sequence_detector;

architecture behavioral of vhdl_moore_fsm_sequence_detector is
    type moore_fsm_t is (state_zero, state_one, state_one_zero, state_one_zero_zero, state_one_zero_zero_one);
    signal current_state, next_state : moore_fsm_t;
begin
    -- State register
    process(clock, reset)
    begin
        if reset = '1' then
            current_state <= state_zero;
        elsif rising_edge(clock) then
            current_state <= next_state;
        end if;
    end process;

    -- Next state logic
    process(current_state, sequence_in)
    begin
        case current_state is
            when state_zero =>
                if sequence_in = '1' then
                    next_state <= state_one;
                else
                    next_state <= state_zero;
                end if;
            when state_one =>
                if sequence_in = '0' then
                    next_state <= state_one_zero;
                else
                    next_state <= state_one;
                end if;
            when state_one_zero =>
                if sequence_in = '0' then
                    next_state <= state_one_zero_zero;
                else
                    next_state <= state_one;
                end if;
            when state_one_zero_zero =>
                if sequence_in = '1' then
                    next_state <= state_one_zero_zero_one;
                else
                    next_state <= state_zero;
                end if;
            when state_one_zero_zero_one =>
                if sequence_in = '1' then
                    next_state <= state_one;
                else
                    next_state <= state_one_zero;
                end if;
        end case;
    end process;

    -- Output logic (Concurrent assignment)
    with current_state select detector_out <=
        '1' when state_one_zero_zero_one,
        '0' when others;

end behavioral;
